from rest_framework import generics
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Profile, Chats, Messages
from .serializers import ProfileSerializer, ChatSerializer, MessageSerializer
from rest_framework.response import Response
from django.db.models import Q

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = Profile
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(user.password)  # Set password on user object
        user.save() 

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Profile.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            user = self.request.user
            queryset = queryset.filter(username__icontains=search).exclude(pk = user.pk)
        return queryset

class IndividualProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return [user]

class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chats.objects.all()
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chats = Chats.objects.filter(participants=user.id).prefetch_related('participants')  # Pre-fetch participants
        return chats

    def create(self, request, *args, **kwargs):
        participant_id = request.data.get('participant_id')

        if not participant_id:
            return Response({'error': 'Missing participant ID'}, status=400)

        participant = Profile.objects.get(pk=participant_id)
        current_user_profile = request.user

        existing_chat = Chats.objects.filter(participants=current_user_profile).filter(participants=participant_id)
        if existing_chat:
            return Response("", status=200)
        else:
            chats_with_deleted = Chats.objects.filter(participants__in=[participant_id, current_user_profile.id]).filter(deleted_users__in = [current_user_profile.id, participant_id]).first()
            if not chats_with_deleted:
                chat = Chats.objects.create(
                    chat_name=participant.username  # Consider using this for dynamic name
                )
                chat.participants.add(current_user_profile, participant)
                chat.save()

                serializer = self.get_serializer(chat)
                return Response(serializer.data, status=201)
            else:
                chats_with_deleted.deleted_users.remove(current_user_profile)
                chats_with_deleted.participants.add(current_user_profile)
        return Response("", status=201)
    
    def destroy(self, request, pk=None):
        try:
            chat = Chats.objects.get(pk=pk)
            user = request.user

            if chat not in user.chats.all():  # Check if user is a participant
                return Response({'error': 'Unauthorized'}, status=403)

            chat.participants.remove(user)
            chat.deleted_users.add(user)
            
            if not chat.participants.count():
                chat.delete()
            else:
                remaining_participant = chat.participants.first()  # Adjust if multiple participants

                # Update chat_name if necessary
                if remaining_participant:
                    chat.chat_name = user.username
                chat.save()

            return Response("", status=204)  # No content returned

        except Chats.DoesNotExist:
            return Response({'error': 'Chat not found'}, status=404)
        except Exception as e:
            print(e)
            return Response({'error': 'An error occurred'}, status=500)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Messages.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
