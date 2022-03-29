document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('#index').addEventListener('click', () => redirect("a"));

  //If user is authenticated, add buttons functions
  const auth = JSON.parse(document.getElementById('auth').textContent);
  if (auth){
    document.querySelector('#following').addEventListener('click', () => redirect("f"));
    document.querySelector('#new-post').addEventListener('click', () => redirect("c"));
  }

  load_posts();
});

function redirect(hash){
    if (hash == "a"){
        window.location.href = "http://127.0.0.1:8000/";
    } else {
        window.location.href = "http://127.0.0.1:8000/#" + hash;
    }
}

function follow(){

    follow_message = 1;
    if (document.querySelector('#follow').value == "Follow"){
        document.querySelector('#follow').setAttribute('value','Unfollow');
    } else {
        document.querySelector('#follow').setAttribute('value','Follow');
        follow_message = -1;
    }

    const csrftoken = getCookie('csrftoken');
    const profile_name = document.querySelector('#profile-name').value;
    const profile_name = document.querySelector('#profile-name').value;
    fetch('/profile/' + profile_name, {
        method: 'PUT',
        body: JSON.stringify({
            profile: profile_name,
            action: follow_message
        }),
        headers: { "X-CSRFToken": csrftoken }
    })
}

function load_posts(){

fetch("/posts/" + document.querySelector('#profile-name').value)
    .then(response => response.json())
    .then(posts => {
        const username = document.querySelector('#username').value;
        //Checks if posts is not empty
        if (Array.isArray(posts)){
            pageNumber =  Math.ceil(posts.length/10); //gets the total number of pages
            let currentPage = getCurrentPage();
            if (pageNumber > 1){
                let previous = document.createElement('li');
                let next = document.createElement('li');
                previous.className = 'page-item';
                next.className = 'page-item';
                previous.innerHTML = `<a class="page-link" href="#" onclick="change_page('previous')">Previous</a>`;
                next.innerHTML = `<a class="page-link" href="#" onclick="change_page('next')">Next</a>`;
                if (currentPage == 1){
                    previous.className = 'page-item disabled';
                }
                else if (currentPage == pageNumber){
                    next.className = 'page-item disabled';
                }
                document.querySelector('#posts-pagination').append(previous);
                for(let i = 1; i <= pageNumber; i++){
                    let li = document.createElement('li');
                    if (i == currentPage){
                        li.className = 'page-item active';
                    } else {
                        li.className = 'page-item';
                    }
                    li.innerHTML = `<a class="page-link" href="${username}?page=${i}">${i}</a>`;
                    document.querySelector('#posts-pagination').append(li);
                }
                document.querySelector('#posts-pagination').append(next);
            }
            postsToShow = posts.paginate(currentPage, 10);
            postsToShow.data.forEach(show_post);
            function show_post(post) {
                const auth = JSON.parse(document.getElementById('auth').textContent);
                let editButton = "";
                const postId = "post" + post.id;
                if(username == post.user){
                    editButton = `<button id="edit-button-${postId}" class="btn btn-primary btn-sm ml-2" onclick="edit('${postId}')">Edit Post</button>`;
                }
                let likeHtml = `<input type="image" src="../media/like.png" id="like-${postId}" width="15" height="15" title="Like Post" onclick="like('like','${postId}')"/>`;
                if (!auth){
                    likeHtml = `<img src="../media/like.png" id="like-${postId}" width="15" height="15" title="Like Post">`;
                } else if (post.users_liked.includes(username)){
                    likeHtml = `<input type="image" src="../media/unlike.png" id="like-${postId}" width="15" height="15" title="Unlike Post" onclick="like('unlike','${postId}')"/>`;
                }

                let div = document.createElement('div');
                div.setAttribute("id", postId);
                div.className = 'border pl-2 mt-2';
                div.innerHTML = `<b><a href=profile/${post.user}>${post.user}</a></b>
                                <span>${post.timestamp}</span>` + editButton + `<br>
                                <span id="content-${postId}">${post.content}</span>
                                <form id="editable-${postId}" style="display:none" onsubmit="return false">
                                <textarea id="textarea-${postId}">${post.content}</textarea>
                                <input type="submit" value="Cancel" class="btn btn-primary btn-sm mb-2" onclick="cancel_edit('${postId}')"/>
                                <input type="submit" value="Confirm Edit" class="btn btn-primary btn-sm mb-2" onclick="confirm_edit('${postId}')"/>
                                </form>
                                <br>` + likeHtml + ` <span id="like-number-${postId}">${post.likes_total} </span>`;
                document.querySelector('#posts-list').appendChild(div);
            }
        }
        if (posts.length == 0){
            document.querySelector('#posts-list').innerHTML= "It looks like there aren't any posts here...";
        }
    })
}


function change_page(direction){
    let currentPage = getCurrentPage();
    if (direction == "next"){
        currentPage++;
    } else {
        currentPage--;
    }
    const username = document.querySelector('#profile-name').value;
    window.location.href = `http://127.0.0.1:8000/profile/${username}?page=${currentPage}`;
}

function edit(id){
    document.querySelector('#content-' + id).style.display = "none";
    document.querySelector('#edit-button-' + id).style.display = "none";
    document.querySelector('#editable-' + id).style.display = "inline-block";
}

function confirm_edit(id){
    const newContent = document.querySelector('#textarea-' + id).value;
    document.querySelector('#editable-' + id).style.display = "none";
    document.querySelector('#edit-button-' + id).style.display = "inline-block";
    document.querySelector('#content-' + id).style.display = "inline-block";
    document.querySelector('#content-' + id).innerHTML = newContent;
    const csrftoken = getCookie('csrftoken');
    intId = id.replace('post','');
    fetch('/edit/' + intId, {
        method: 'PUT',
        body: JSON.stringify({
            content: newContent
        }),
        headers: { "X-CSRFToken": csrftoken }
    })
}

function cancel_edit(id){
    document.querySelector('#editable-' + id).style.display = "none";
    document.querySelector('#edit-button-' + id).style.display = "inline-block";
    document.querySelector('#content-' + id).style.display = "inline-block";
}

function like(action, id){

    let likeNumber = document.querySelector('#like-number-' + id).innerHTML;
    if (action == "like"){
        document.querySelector('#like-' + id).src= "../media/unlike.png";
        document.querySelector('#like-' + id).title = "Unlike Post";
        document.querySelector('#like-' + id).setAttribute( "onClick", `javascript: like('unlike', '${id}');` );
        likeNumber++;
        document.querySelector('#like-number-' + id).innerHTML = likeNumber;
    } else {
        document.querySelector('#like-' + id).src= "../media/like.png";
        document.querySelector('#like-' + id).title = "Like Post";
        document.querySelector('#like-' + id).setAttribute( "onClick", `javascript: like('like', '${id}');` );
        likeNumber--;
        document.querySelector('#like-number-' + id).innerHTML = likeNumber;
    }

    const csrftoken = getCookie('csrftoken');
    intId = id.replace('post','');

    fetch('/like/' + intId, {
        method: 'PUT',
        body: JSON.stringify({
            like: true,
        }),
        headers: { "X-CSRFToken": csrftoken }
    })
}
