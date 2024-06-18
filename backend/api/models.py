from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager
from django.utils.translation import gettext_lazy as _


# Create your models here.
class Profile(AbstractUser):
    email = models.EmailField(_("Email Address"), unique=True)
    username = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True)
    bio = models.CharField(max_length=1000, blank=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return str(self.email)

class Chats(models.Model):
    participants = models.ManyToManyField(Profile, related_name="chats")
    deleted_users = models.ManyToManyField(Profile, related_name='deleted_chats', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    chat_name = models.CharField(max_length=100, blank=True)

    def get_messages(self):
        return self.messages.all()
    
    def __str__(self):
        return f"{self.chat_name}"

class Messages(models.Model):
    chat = models.ForeignKey(Chats, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.message}"