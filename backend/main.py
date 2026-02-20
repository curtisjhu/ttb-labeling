
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
import os
from datetime import datetime

from google.cloud import storage
from google.api_core.client_options import ClientOptions
from google.cloud import documentai_v1 as documentai


# Set your GCP bucket name here or via env var
GCP_BUCKET_NAME = os.getenv("GCP_BUCKET_NAME", "ttb-labeling")

project_id = "funnyscar"
processor_id = "8ff7d4451ca896c5"
location = "us"
processor_version_id = None


app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def read_root():
    return {"message": "Hello from backend!"}


@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG and JPEG files are allowed.")
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        blob = bucket.blob(f'uploads/{timestamp}/{file.filename}')

        blob.upload_from_file(file.file, content_type=file.content_type)
        public_path = blob.public_url

        gcs_input_uri = f'gs://{bucket.name}/{blob.name}'
        

        opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
        client = documentai.DocumentProcessorServiceClient(client_options=opts)


        gcs_document = documentai.GcsDocument(
            gcs_uri=gcs_input_uri,
            mime_type=file.content_type
        )
        # Load GCS Input URI into a List of document files
        gcs_documents = documentai.GcsDocuments(documents=[gcs_document])


        if processor_version_id:
            name = client.processor_version_path(
                project_id, location, processor_id, processor_version_id
            )
        else:
            name = client.processor_path(project_id, location, processor_id)

        request = documentai.ProcessRequest(
            name=name,
            gcs_document=gcs_document
        )

        result = client.process_document(request=request)

        document = result.document

        res = {}

        if document.entities:
            for entity in document.entities:
                res[entity.type_] = entity.mention_text
                for prop in entity.properties:
                    res[prop.type_] = prop.mention_text
        
        return JSONResponse({"success": True, "result": res, "text": document.text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")





# POST endpoint for multiple file upload to GCP bucket
@app.post("/upload-multiple")
async def upload_multiple_files(files: list[UploadFile] = File(...)):
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCP_BUCKET_NAME)

    for file in files:
        if file.content_type not in ["image/png", "image/jpeg"]:
            raise HTTPException(status_code=400, detail="Only PNG and JPEG files are allowed.")
    
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    for file in files:
        try:
            blob = bucket.blob(f'uploads/{timestamp}/{file.filename}')
            blob.upload_from_file(file.file,
                content_type=file.content_type,
                rewind=True,  # Ensures file pointer is at start
                timeout=600,  # Increase timeout for large files
                # num_retries=3,
                size=None,  # Let GCS handle chunking
                if_generation_match=None,
                client=storage_client,
                predefined_acl=None,
                checksum=None,
                retry=None,
                # timeout_type=None,
                # chunk_size=1024 * 1024 * 10  # 10MB chunks, adjust as needed
            )

            gs_uri = f'gs://{bucket.name}/{blob.name}'

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload failed for {file.filename}: {e}")
    


    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
    client = documentai.DocumentProcessorServiceClient(client_options=opts)

    # Specify a GCS URI Prefix to process an entire directory
    gcs_prefix = documentai.GcsPrefix(gcs_uri_prefix=f'gs://{bucket.name}/uploads/{timestamp}/')
    input_config = documentai.BatchDocumentsInputConfig(gcs_prefix=gcs_prefix)

    # Cloud Storage URI for the Output Directory
    gcs_output_config = documentai.DocumentOutputConfig.GcsOutputConfig(
        gcs_uri=f'gs://{bucket.name}/outputs/{timestamp}/'
    )

    # Where to write results
    output_config = documentai.DocumentOutputConfig(gcs_output_config=gcs_output_config)

    if processor_version_id:
        name = client.processor_version_path(
            project_id, location, processor_id, processor_version_id
        )
    else:
        name = client.processor_path(project_id, location, processor_id)


    request = documentai.BatchProcessRequest(
        name=name,
        input_documents=input_config,
        document_output_config=output_config,
    )


    # Return the operation name so the client can poll for status
    operation = client.batch_process_documents(request=request)
    operation_name = operation.operation.name
    return JSONResponse({
        "success": True,
        "job_id": timestamp,
        "operation_name": operation_name,
        "message": f"Files uploaded and processing started. Output will be saved to gs://{bucket.name}/outputs/{timestamp}/"
    })


################################################
# UNTESTED - GCP UPLOAD ENDPOINTS
# On second thought, we'll bypass these api calls
# they can be rate limited, and body limits etc...
################################################


# Check status of a Document AI batch operation
@app.get("/operation-status/{operation_name}")
async def get_operation_status(operation_name: str):
    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
    client = documentai.DocumentProcessorServiceClient(client_options=opts)
    op = client.transport.operations_client.get_operation(operation_name)
    return JSONResponse({
        "operation_name": operation_name,
        "done": op.done,
        "metadata": op.metadata.__class__.__name__ if op.metadata else None,
        "error": op.error.message if op.error else None
    })


@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCP_BUCKET_NAME)

    # List all blobs in the output directory for this job
    output_prefix = f"outputs/{job_id}/"
    blobs = list(bucket.list_blobs(prefix=output_prefix))
    public_urls = [blob.public_url for blob in blobs if not blob.name.endswith("/")]

    status = "completed" if public_urls else "processing"

    return JSONResponse({
        "job_id": job_id,
        "status": status,
        "public_urls": public_urls
    })


@app.post("/generate-upload-url")
def generate_upload_url():
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCP_BUCKET_NAME)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    blob = bucket.blob(f"uploads/{timestamp}")
    url = blob.generate_signed_url(
        version="v4",
        expiration=600,  # 10 minutes
        method="PUT",
        content_type=None,
    )
    return {"url": url, "id": timestamp}




