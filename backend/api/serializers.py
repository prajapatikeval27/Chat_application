from .models import Profile, Chats, Messages, AI
from rest_framework import serializers

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'
        extra_kwargs = {"password": { "write_only": True }}

class ChatSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    chat_name = serializers.CharField(max_length=100)
    class Meta:
        model = Chats
        fields = '__all__'
        
    def get_participants(self, obj):
        data = []
        for participant in obj.participants.all():
            dict = {
                "id": participant.id,
                "username": participant.username,
                "last_name": participant.last_name,
                "bio": participant.bio
            }
            data.append(dict)
        return data

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Messages
        fields = '__all__'

class AISerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()
    class Meta:
        model = AI
        fields = '__all__'
        
    def get_messages(self, obj):
        data = []
        for message in obj.messages.all():
            dict = {
                "id": message.id,
                "sender": message.sender.id,
                "created_at": message.created_at
            }
            data.append(dict)
        return data