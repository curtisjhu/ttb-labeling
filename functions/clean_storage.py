import os
from datetime import datetime, timezone, timedelta
from google.cloud import storage

# Configurable parameters
BUCKET_NAME = os.getenv("GCP_BUCKET_NAME", "ttb-labeling")
AGE_DAYS = int(os.getenv("CLEAN_AGE_DAYS", 3))  # Delete files older than 7 days by default
# PREFIX = os.getenv("CLEAN_PREFIX", "/")  # Only clean files under this prefix

def clean_old_gcs_objects():
	client = storage.Client()
	bucket = client.bucket(BUCKET_NAME)
	now = datetime.now(timezone.utc)
	cutoff = now - timedelta(days=AGE_DAYS)
	deleted = 0
	for blob in bucket.list_blobs():
		if blob.time_created < cutoff:
			print(f"Deleting {blob.name} (created {blob.time_created})")
			blob.delete()
			deleted += 1
	print(f"Deleted {deleted} objects older than {AGE_DAYS} days in {BUCKET_NAME}")

if __name__ == "__main__":
	clean_old_gcs_objects()


