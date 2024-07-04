from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    # path('ws/chats/<chat_id>/', consumers.ChatConsumer.as_asgi()),
    re_path(r"^ws/chats/(?P<chat_id>\w+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"^ws/aichats/(?P<ai_id>\w+)/$", consumers.AIConsumer.as_asgi()),
]