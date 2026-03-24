"""Script para construir el Lambda Layer con wheels de Linux."""
import subprocess, sys, os

target = os.path.join(os.path.dirname(__file__), ".layer-build", "python")
os.makedirs(target, exist_ok=True)

pkgs = ["requests", "pandas", "numpy", "fastapi", "mangum", "boto3", "uvicorn"]

env = os.environ.copy()
env["PIP_NO_USER"] = "1"

cmd = [
    sys.executable, "-m", "pip", "install",
    "--isolated",
    "--no-user",
    "--platform", "manylinux2014_x86_64",
    "--implementation", "cp",
    "--python-version", "3.11",
    "--only-binary", ":all:",
    "--target", target,
] + pkgs

print("Instalando:", " ".join(pkgs))
result = subprocess.run(cmd, capture_output=False, env=env)
if result.returncode == 0:
    print("\nOK - Layer construido en:", target)
else:
    print("\nERROR en build")
    sys.exit(1)
