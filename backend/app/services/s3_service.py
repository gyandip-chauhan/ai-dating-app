# backend/app/services/s3_service.py
import boto3
from app.core.config import settings
from typing import Optional, BinaryIO
import uuid

class S3Service:
    def __init__(self):
        self.s3_client = None
        self.bucket_name = settings.AWS_S3_BUCKET
        
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
    
    async def upload_file(self, file_data: BinaryIO, file_name: str, content_type: str) -> Optional[str]:
        if not self.s3_client or not self.bucket_name:
            return None
        
        try:
            # Generate unique file name
            file_extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
            unique_file_name = f"{uuid.uuid4()}.{file_extension}"
            
            # Upload to S3
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                unique_file_name,
                ExtraArgs={'ContentType': content_type}
            )
            
            return unique_file_name
            
        except Exception as e:
            print(f"S3 upload failed: {str(e)}")
            return None
    
    async def get_presigned_url(self, file_key: str, expiration: int = 3600) -> Optional[str]:
        if not self.s3_client or not self.bucket_name:
            return None
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            print(f"Presigned URL generation failed: {str(e)}")
            return None
