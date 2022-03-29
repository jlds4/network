from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followed = models.ManyToManyField("User", blank=True, related_name="following")
    follower = models.ManyToManyField("User", blank=True, related_name="followers")

    def serialize(self):
        return {
            "id": self.id,
            "user": self.username,
            "following": [user.username for user in self.followed.all()],
            "followers": [user.username for user in self.follower.all()]
        }


class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posted")
    likes = models.ManyToManyField("User", blank=True, related_name="liked")
    content = models.CharField(max_length=300)
    timestamp = models.DateTimeField(auto_now_add=True)
    like_number = models.IntegerField()

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes_total": self.like_number,
            "users_liked": [user.username for user in self.likes.all()]
        }



