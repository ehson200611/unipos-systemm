import json, os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsManagerOrAdmin

import pathlib
SETTINGS_FILE = str(pathlib.Path(__file__).resolve().parent.parent / 'app_settings.json')

def _load():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    return {}

def _save(data):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(data, f)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_settings(request):
    return Response(_load())

@api_view(['POST'])
@permission_classes([IsManagerOrAdmin])
def update_settings(request):
    data = _load()
    data.update(request.data)
    _save(data)
    return Response(data)
