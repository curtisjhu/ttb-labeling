import os
from google.cloud import storage
from fastapi import FastAPI

app = FastAPI()

@app.post("/trigger-stream-completion")
def trigger_stream_completion(data: dict):
    # Example: data contains bucket and prefix
    bucket_name = data.get("bucket")
    prefix = data.get("prefix")
    if not bucket_name or not prefix:
        return {"error": "Missing bucket or prefix"}

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blobs = list(bucket.list_blobs(prefix=prefix))
    file_names = [blob.name for blob in blobs]

    # Add your processing logic here
    # For example, trigger Document AI batch processing

    return {"success": True, "files": file_names}

# Cloud Run entrypoint
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
