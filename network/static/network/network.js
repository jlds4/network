document.addEventListener('DOMContentLoaded', function() {


  document.querySelector('#index').addEventListener('click', () => load_posts("all"));
  document.querySelector('#following').addEventListener('click', () => load_posts("following"));
  document.querySelector('#new-post').addEventListener('click', () => compose_post());



  if (window.location.hash == "#f"){
    load_posts("following");
  }
  else if (window.location.hash == "#c"){
    compose_post();
  } else{
    //Load all posts by default
    load_posts("all");
  }

});


function load_posts(type){

  const parameters = new URLSearchParams(window.location.search);
  const page = parameters.get('page');
  if(window.location.hash && type=="all"){
    if (page == null){
      history.replaceState(null, null, ' ');
    }
    else{
      window.location.href = "http://127.0.0.1:8000/"
    }
  }
  fetch("/posts/" + type)
    .then(response => response.json())
    .then(posts => {
        if (type == "all"){
            document.querySelector('#header').innerHTML="All posts";

        } else if (type=="following"){
            if (window.location.hash != "#f"){
                window.location.href = "http://127.0.0.1:8000/#f"
            }
            document.querySelector('#header').innerHTML="Following";
        }
        document.querySelector('#posts-list').innerHTML = "";

        //Checks if posts is not empty
        if (Array.isArray(posts)){
            pageNumber =  Math.ceil(posts.length/10); //gets the total number of pages
            let currentPage = getCurrentPage();
            document.querySelector('#posts-pagination').innerHTML = "";
            //Pagination
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
                let followingHash = "";
                if (window.location.hash == "#f"){
                    followingHash = "#f"
                }
                document.querySelector('#posts-pagination').append(previous);
                for(let i = 1; i <= pageNumber; i++){
                    let li = document.createElement('li');
                    if (i == currentPage){
                        li.className = 'page-item active';
                    } else {
                        li.className = 'page-item';
                    }
                    li.innerHTML = `<a class="page-link" href="/?page=${i}${followingHash}">${i}</a>`;
                    document.querySelector('#posts-pagination').append(li);
                }
                document.querySelector('#posts-pagination').append(next);
            }
            postsToShow = posts.paginate(currentPage, 10);
            postsToShow.data.forEach(show_post);
            function show_post(post) {
                let editButton = "";
                const postId = "post" + post.id;
                const username = JSON.parse(document.getElementById('username').textContent);
                if(username == post.user){
                    editButton = `<button id="edit-button-${postId}" class="btn btn-primary btn-sm ml-2" onclick="edit('${postId}')">Edit Post</button>`;
                }
                let likeHtml = `<input type="image" src="../media/like.png" id="like-${postId}" width="15" height="15" title="Like Post" onclick="like('like','${postId}')"/>`;
                if (post.users_liked.includes(username)){
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
  document.querySelector('#all-posts-view').style.display = 'block';
  document.querySelector('#new-post-view').style.display = 'none';


}



function compose_post(){

  const parameters = new URLSearchParams(window.location.search);
  const page = parameters.get('page');
  if (page != null){
    window.location.href = "http://127.0.0.1:8000/#c"
  }
  document.querySelector('#all-posts-view').style.display = 'none';
  document.querySelector('#new-post-view').style.display = 'block';

  document.querySelector('#post-content').value = '';
}

function new_post(){

  const content = document.querySelector('#post-content').value;
  const csrftoken = getCookie('csrftoken');
  event.preventDefault(); //Prevents refreshing the page before the POST function
  fetch('/posts', {
    method: 'POST',
    body: JSON.stringify({
      content: content,
    }),
    headers: { "X-CSRFToken": csrftoken }
  })
  load_posts("all");
}

function change_page(direction){
    let currentPage = getCurrentPage();
    let followingHash = "";
    if (window.location.hash == "#f"){
      followingHash = "#f"
    }
    if (direction == "next"){
        currentPage++;
    } else {
        currentPage--;
    }
    window.location.href = `http://127.0.0.1:8000/?page=${currentPage}${followingHash}`;
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







