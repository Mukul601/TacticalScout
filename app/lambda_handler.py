"""
AWS Lambda entrypoint for API Gateway (optional).
Use this when deploying the FastAPI app behind API Gateway + Lambda.

Set Lambda handler to: app.lambda_handler.handler
"""
from mangum import Mangum

from app.main import app

handler = Mangum(app, lifespan="off")
