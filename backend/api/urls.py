from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'chats', views.ChatViewSet, basename='chats')
router.register(r'ai', views.AIViewSet, basename='ai')
router.register(r'messages', views.MessageViewSet, basename='messages')
router.register(r'profiles', views.ProfileViewSet, basename='profiles')
router.register(r'individual_profile', views.IndividualProfileViewSet, basename='individual_profile')

urlpatterns = [
    # path('profiles/', views.ProfileViewSet.as_view(), name='profile-list'),
    # path('chats/', views.getChats.as_view(), name="chat-list"),
]

urlpatterns += router.urls