from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post
import json


def index(request):
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    else:
        return render(request, "network/notlogged.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("login"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def load_posts(request, type):
    # Returns all posts or all posts of users being followed
    if type == "all":
        posts = Post.objects.all()
    elif type == "following":
        following = request.user.followed.all()
        for f in following:
            post = Post.objects.filter(user=f)
            try:
                posts = posts | post
            except UnboundLocalError:
                posts = post
    else:
        user = User.objects.get(username=type)
        posts = Post.objects.filter(user=user)
    # If posts is empty
    try:
        posts = posts.order_by("-timestamp").all()
    except UnboundLocalError:
        return JsonResponse({"message": "no posts to show"})

    return JsonResponse([post.serialize() for post in posts], safe=False)


def profile(request, username):
    user = User.objects.get(username=username)
    if request.method == "GET":
        posts = Post.objects.filter(user=user)
        follower_count = user.following.count()
        following_count = user.followed.count()
        followers = user.following.all()
        follow = "Follow"
        for f in followers:
            if f == request.user:
                follow = "Unfollow"
        return render(request, "network/profile.html", {
            "profile": user,
            "posts": posts,
            "followers": follower_count,
            "following": following_count,
            "is_following": follow
        })

    elif request.method == "PUT":
        data = json.loads(request.body)
        profile = request.user
        action = data.get("action")
        if action == 1:
            profile.followed.add(user)
            user.follower.add(profile)
        else:
            profile.followed.remove(user)
            user.follower.remove(profile)
        user.save()
        profile.save()
        return HttpResponse(status=204)


@login_required
def new(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    data = json.loads(request.body)
    content = data.get("content", "")
    post = Post(
        user=request.user,
        content=content,
        like_number=0
    )
    post.save()
    return JsonResponse({"message": "Posted successfully."}, status=201)


@login_required
def edit(request, post_id):
    post = Post.objects.get(id=post_id)
    if post.user != request.user:
        return HttpResponse('Unauthorized', status=401)
    data = json.loads(request.body)
    new_content = data.get("content")
    post.content = new_content
    post.save()
    return HttpResponse(status=204)


@login_required
def like(request, post_id):
    post = Post.objects.get(id=post_id)
    if request.user in post.likes.all():
        post.likes.remove(request.user)
        post.like_number -= 1
    else:
        post.likes.add(request.user)
        post.like_number += 1
    post.save()
    return HttpResponse(status=204)





