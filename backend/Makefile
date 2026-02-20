
dev:
	uvicorn main:app --host 0.0.0.0 --port 8080

prod:
	gunicorn --bind :8080 --workers 1 --threads 8 main:app

reauth:
	gcloud auth login

deploy:
	gcloud run deploy ttb-labeling \
		--source . \
		--region us-central1 \
		--allow-unauthenticated