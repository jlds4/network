Array.prototype.paginate = function(pageNumber, itemsPerPage){
  pageNumber   = Number(pageNumber)
  itemsPerPage = Number(itemsPerPage)
  pageNumber   = (pageNumber   < 1 || isNaN(pageNumber))   ? 1 : pageNumber
  itemsPerPage = (itemsPerPage < 1 || isNaN(itemsPerPage)) ? 1 : itemsPerPage

  var start     = ((pageNumber - 1) * itemsPerPage)
  var end       = start + itemsPerPage
  var loopCount = 0
  var result    = {
    data: [],
    end: false
  }

  for(loopCount = start; loopCount < end; loopCount++){
    this[loopCount] && result.data.push(this[loopCount]);
  }

  if(loopCount == this.length){
    result.end = true
  }

  return result
}

function getCurrentPage(){
    let currentPage = 1;
    const parameters = new URLSearchParams(window.location.search);
    const page = parameters.get('page');
    if (page != null){
      currentPage = page;
    }
    return currentPage;
}