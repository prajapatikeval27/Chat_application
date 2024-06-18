from django.contrib import admin
from .models import Profile, Chats, Messages
# Register your models here.

class ChatsAdmin(admin.ModelAdmin):
    list_display = ["chat_name","created_at"]

class MessagesAdmin(admin.ModelAdmin):
    list_display = ["chat","sender","message","is_read","created_at"]

class ProfileAdmin(admin.ModelAdmin):
    list_display = ["email","username","last_name","bio"]

admin.site.register(Chats, ChatsAdmin)
admin.site.register(Messages, MessagesAdmin)
admin.site.register(Profile, ProfileAdmin)
