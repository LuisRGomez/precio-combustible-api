"""
Punto de entrada Lambda para la API FastAPI via Mangum.
Mangum traduce el evento HTTP API Gateway v2 en ASGI scope para FastAPI.
"""
from mangum import Mangum
from main import app

handler = Mangum(app, lifespan="off")
