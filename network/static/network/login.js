document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('#index').addEventListener('click', () => window.location.href = 'http://127.0.0.1:8000/');
  load_posts();
});

function load_posts(){

  fetch("/posts/all")
    .then(response => response.json())
    .then(posts => {
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
                    li.innerHTML = `<a class="page-link" href="/?page=${i}">${i}</a>`;
                    document.querySelector('#posts-pagination').append(li);
                }
                document.querySelector('#posts-pagination').append(next);
            }
            postsToShow = posts.paginate(currentPage, 10);
            postsToShow.data.forEach(show_post);
            function show_post(post) {
                let likeHtml = `<img src="../media/like.png" alt="heart" width="15" height="15" title="Like Post">`;
                let div = document.createElement('div');
                div.className = 'border pl-2 mt-2';
                div.innerHTML = `<b><a href=profile/${post.user}>${post.user}</a></b>
                                <span>${post.timestamp}</span><br>
                                <span>${post.content}</span>
                                <br>` + likeHtml + ` <span>${post.likes_total} </span>`;
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
    window.location.href = `http://127.0.0.1:8000/?page=${currentPage}`;
}