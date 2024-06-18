import jwt
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from api.models import Chats, Messages, Profile
from asgiref.sync import sync_to_async
from django.conf import settings
from channels.layers import get_channel_layer

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = 'user_%s' % self.room_name
        self.user_id = None
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    @sync_to_async
    def create_message(self, data, user_id):
        message = data['message']
        chat_id = int(data['chat_id'])
        user = Profile.objects.get(pk=user_id)
        try:
            chat = Chats.objects.get(pk = chat_id)
            message = Messages.objects.create(
                chat=chat,
                sender=user,
                message=message,
                is_read = False,
            )
            print("success".center(150,'-'))
            return (message,user)

        except (Chats.DoesNotExist, ValueError):
            print("Invalid Chat id or message data".center(150,'-'))
            return 

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('message_type')
        if text_data_json.get('token'):
            try:
                token = text_data_json['token']
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.SIMPLE_JWT['ALGORITHM']])
                self.user_id = decoded_token.get('user_id')
            except jwt.exceptions.JWTDecodeError:
                print("Invalid token format")

        if message_type == "onopen":
            chat_id = text_data_json.get('chat_id')
            # is_read = self.is_message_read(message, self.user_id)
            await self.send_data(chat_id)
            
        else:

            response, user = await self.create_message(text_data_json, self.user_id)
            
            username = user.username
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'sender': username,
                    'response': response.id,
                    'user_id': self.user_id,
                    'message': text_data_json['message'],
                }
            )

    @sync_to_async
    def get_messages_json(self, chat_id):
        chat = Chats.objects.get(pk=chat_id)
        messages = chat.messages.all()
        data = []
        for message in messages:
            is_read = self.is_message_read(message)
            if is_read:
                message.is_read = True
                message.save()
            msg = {
                "user_id": message.sender.id,
                "sender": message.sender.username,
                "message": message.message,
                "is_read": message.is_read
            }
            data.append(msg)

        return data
    
    # @sync_to_async
    def is_message_read(self, message):
        if message.sender.id != self.user_id:
            return True
        return False

    async def send_data(self, chat_id):
        messages = await self.get_messages_json(chat_id)
        await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'initial_messages',
                    'messages': messages,
                }
        )

    # Receive message from room group
    async def initial_messages(self, event):
        if event.get('type') == "initial_messages":
            messages = event.get('messages')
            await self.send(text_data=json.dumps({
                'type': event['type'],
                'messages': messages,
            }))

    @sync_to_async
    def get_message_object(self, message_id):
        message = Messages.objects.get(pk=message_id)
        return message

    async def chat_message(self, event):
        if event.get('type') == "chat_message":
            sender = event.get('sender')
            message = event.get('message')
            user_id = event.get('user_id')
            response_id = event.get('response')
            
            message_object = await self.get_message_object(response_id)

            await self.send(text_data=json.dumps({
                'type': event['type'],
                'user_id': event['user_id'],
                'sender': sender,
                'is_read': message_object.is_read,
                'message': message,
            }))