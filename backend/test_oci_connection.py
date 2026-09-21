import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from dotenv import load_dotenv
load_dotenv()

import oci


def main():
    config_path = os.environ.get("OCI_CONFIG_PATH", "~/.oci/config")
    profile = os.environ.get("OCI_CONFIG_PROFILE", "DEFAULT")
    namespace = os.environ.get("OCI_NAMESPACE")
    buckets = [
        os.environ.get("BUCKET_RECIBIDOS", "mediflow-recibidos"),
        os.environ.get("BUCKET_PROCESADOS", "mediflow-procesados"),
        os.environ.get("BUCKET_AUDITORIA", "mediflow-auditoria"),
    ]

    if not namespace:
        print("FALTA OCI_NAMESPACE en el .env")
        return

    print("Conectando a OCI...")
    try:
        config = oci.config.from_file(file_location=config_path, profile_name=profile)
        client = oci.object_storage.ObjectStorageClient(config)
        print("OK | Conexión exitosa")
    except Exception as e:
        print(f"ERROR | No se pudo conectar: {e}")
        print("  Revisa ~/.oci/config y la private key")
        return

    for bucket in buckets:
        try:
            client.get_bucket(namespace_name=namespace, bucket_name=bucket)
            print(f"OK | Bucket {bucket} existe")
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                print(f"ERROR | Bucket {bucket} no existe, crealo en la consola de OCI")
            else:
                print(f"ERROR | {bucket}: {e.message}")
            return

    test_bucket = buckets[0]
    test_obj = "_test_connection.txt"
    test_data = b"test mediflow"

    try:
        client.put_object(namespace_name=namespace, bucket_name=test_bucket,
                          object_name=test_obj, put_object_body=test_data)
        print("OK | Subida de prueba exitosa")
    except oci.exceptions.ServiceError as e:
        print(f"ERROR | Subida: {e.message}")
        return

    try:
        resp = client.get_object(namespace_name=namespace, bucket_name=test_bucket,
                                 object_name=test_obj)
        if resp.data.content == test_data:
            print("OK | Lectura de prueba exitosa")
        else:
            print("ERROR | Datos no coinciden")
            return
    except oci.exceptions.ServiceError as e:
        print(f"ERROR | Lectura: {e.message}")
        return

    try:
        client.delete_object(namespace_name=namespace, bucket_name=test_bucket,
                             object_name=test_obj)
        print("OK | Limpieza exitosa")
    except oci.exceptions.ServiceError as e:
        print(f"ERROR | Limpieza: {e.message}")
        return

    print("\nTodo OK | OCI Object Storage listo")


if __name__ == "__main__":
    main()
