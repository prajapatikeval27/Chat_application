import jwt
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from api.models import Chats, Messages, Profile, AI
from asgiref.sync import sync_to_async
from django.conf import settings
from channels.layers import get_channel_layer
import google.generativeai as genai


class AIConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['ai_id']
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
        ai_id = int(data['ai_id'])
        try:
            user = Profile.objects.get(pk=user_id)
        except:
            user = Profile.objects.get(email="ai@gmail.com")
        try:
            ai = AI.objects.get(pk = ai_id)
            message = Messages.objects.create(
                ai = ai,
                chat=None,
                sender=user,
                message=message,
                is_read = False,
            )
            return (message,user)

        except (Chats.DoesNotExist, ValueError):
            print("Invalid Chat id or message data".center(150,'-'))
            return 

    @sync_to_async
    def clear_ai_chat(self, ai_id):
        message_objects = Messages.objects.filter(ai=ai_id)
        for object in message_objects:
            object.delete()
        return True

    @sync_to_async
    def generate_ai_response(self, prompt):
        genai.configure(api_key="YOUR_GOOGLE_AI_API_KEY")
        response = genai.generate_text(prompt=prompt)
        return response.result

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

        ai_id = text_data_json.get('ai_id')
        if message_type == "onopen":
            await self.send_data(ai_id)
        elif message_type == "clear_chat":
            clear_chat_ai_id = text_data_json.get('ai_id')
            is_clear = await self.clear_ai_chat(clear_chat_ai_id)
            if is_clear:
                await self.send_data(clear_chat_ai_id)
        else:
            response, user = await self.create_message(text_data_json, self.user_id)
            
            username = user.username
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'sender': username,
                    'response': response.id,
                    'ai_id': ai_id,
                    'user_id': self.user_id,
                    'message': text_data_json['message'],
                }
            )
            await self.send_ai_message(text_data_json['message'], ai_id)

    async def ai_response(self, event):
        if event.get('type') == "ai_response":
            sender = event.get('sender')
            message = event.get('message')
            response_id = event.get('response')
            message_object = await self.get_message_object(response_id)

            await self.send(text_data=json.dumps({
                'type': event['type'],
                'user_id': event['user_id'],
                'sender': sender,
                'is_read': message_object.is_read,
                'is_deleted': message_object.is_deleted,
                'message': message,
            }))

    async def send_ai_message(self, message, ai_id):
        ai_response = await self.generate_ai_response(message)
        data = {
            "message": ai_response,
            "ai_id": ai_id
        }
        ai_res, ai_user = await self.create_message(data, 0)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'ai_response',
                'sender': ai_user.username,
                'response': ai_res.id,
                'user_id': ai_res.id,
                'message': ai_response,
            }
        )

    @sync_to_async
    def get_messages_json(self, ai_id):
        ai = AI.objects.get(pk=ai_id)
        messages = ai.messages.all()
        data = []
        for message in messages:
            msg = {
                "user_id": message.sender.id,
                "id": message.id,
                "sender": message.sender.username,
                "message": message.message,
                "is_edited": message.is_edited,
                "is_deleted": message.is_deleted,
            }
            data.append(msg)

        return data

    async def send_data(self, ai_id):
        messages = await self.get_messages_json(ai_id)
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
            response_id = event.get('response')
            ai_id = event.get('ai_id')
            message_object = await self.get_message_object(response_id)

            await self.send(text_data=json.dumps({
                'type': event['type'],
                'user_id': event['user_id'],
                'sender': sender,
                'is_read': message_object.is_read,
                'is_deleted': message_object.is_deleted,
                'message': message,
            }))

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
                ai = None,
                chat=chat,
                sender=user,
                message=message,
                is_read = False,
            )
            is_read = self.is_message_read(message)
            if is_read:
                message.is_read = True
                message.save()
            return (message,user)

        except (Chats.DoesNotExist, ValueError):
            print("Invalid Chat id or message data".center(150,'-'))
            return 

    @sync_to_async
    def delete_message(self, message_id):
        try:
            message = Messages.objects.get(pk = message_id)
            message.message = "This message was deleted."
            message.is_deleted = True
            message.save()
            return True
        except:
            return False
    
    @sync_to_async
    def edit_message(self, message_id, new_message):
        try:
            message = Messages.objects.get(pk = message_id)
            message.message = new_message
            message.is_edited = True
            message.save()
            return True
        except:
            return False

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

        chat_id = text_data_json.get('chat_id')
        if message_type == "onopen":
            await self.send_data(chat_id)

        elif message_type == "message_modification":
            message_id = text_data_json.get('message_id')
            if text_data_json.get('type') == "delete":
                delete_message = await self.delete_message(message_id=message_id)

                if delete_message:
                    await self.send_data(chat_id=chat_id)
            else:
                new_message = text_data_json.get('message')
                edit_message = await self.edit_message(message_id=message_id, new_message=new_message)

                if edit_message:
                    await self.send_data(chat_id=chat_id)

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
                "id": message.id,
                "sender": message.sender.username,
                "message": message.message,
                "is_edited": message.is_edited,
                "is_read": message.is_read,
                "is_deleted": message.is_deleted,
            }
            data.append(msg)

        return data

    # @sync_to_async
    def is_message_read(self, message):
        if self.user_id:
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
            response_id = event.get('response')
            
            message_object = await self.get_message_object(response_id)

            await self.send(text_data=json.dumps({
                'type': event['type'],
                'user_id': event['user_id'],
                'sender': sender,
                'is_read': message_object.is_read,
                'is_deleted': message_object.is_deleted,
                'message': message,
            }))