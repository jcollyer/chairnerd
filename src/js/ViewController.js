var API = require('./api'),
    Post = require('./Post'),
    _ = require('lodash');

var actionsTrackerArray = [];
var clickedUndoButton = false;
var bodyContent = document.getElementsByClassName('blog-body__content')[0];
var stepBackDOMElement = document.getElementById('step-back');

var deletePost = function(){
  var elements = that.generatePostDOMElements(that.postCollection);
  bodyContent.innerHTML = "";
  that.renderPosts(elements);
};

addCounter = function(action, id, title, body) {
  actionsTrackerArray.push({"action":action, "id":id, "title":title, "body":body});
  if (actionsTrackerArray.length > 0) stepBackDOMElement.className = "";
};
var ViewController = function(model) {
  this.model = model;
  this.postCollection = [];

  var postTemplate = document.getElementById('blog-post-template');
  this.template = _.template(postTemplate.textContent.trim());
  this.initialize();
};

ViewController.prototype.initialize = function() {
  this.establishHandlers();
  this.stepBack();
  this.fetchPosts();
  var elements = this.generatePostDOMElements(this.postCollection);
  this.renderPosts(elements);
}

ViewController.prototype.establishHandlers = function() {
  var that = this;
  document.getElementsByClassName('blog-body__form-section__form__submit')[0]
  .addEventListener('click', function(e) {
    e.preventDefault();
    clickedUndoButton = false;
    var title = document.getElementsByClassName('blog-body__form-section__form__title')[0].value;
    var body = document.getElementsByClassName('blog-body__form-section__form__body')[0].value;
    that.handleSubmit({
      title: title,
      body: body
    });
  })
};

ViewController.prototype.stepBack = function() {
  that = this;

  stepBackDOMElement
  .addEventListener('click', function(e) {
    clickedUndoButton = true;

    var lastAction = actionsTrackerArray.slice(-1)[0];
    if(lastAction.action === 1){ //action === 1, which is "add", so to undo, we need to remove post.
      that.postCollection.pop();
      API.remove(lastAction.id);
      deletePost();

    } else { //if action === 2, or "remove", we need to undo, so bring back the post!
      data = {title:lastAction.title, body:lastAction.body};
      that.addPost(data);
    }

    actionsTrackerArray.pop();//pop off the last action each time we click step-back.
    if (actionsTrackerArray.length === 0) stepBackDOMElement.className = "hide"; //hide step-back button if can't go back anymore.
  });
};

ViewController.prototype.fetchPosts = function() {
  var response = API.get();
  if (response.status === 200) {
    this.postCollection = response.body.map(function(post) {
      return new Post(JSON.parse(post));
    }).reverse();
  }
};

ViewController.prototype.generatePostDOMElements = function(posts) {
  var that = this;
  return posts.map(function(post) {
    var html = that.template(post.attributes);
    var wrapperDiv = document.createElement('div');
    wrapperDiv.innerHTML = html;
    return wrapperDiv.firstChild;
  });
};

ViewController.prototype.renderPosts = function(postDOMElements) {
  postDOMElements.forEach(function(element) {
    bodyContent.appendChild(element);
  });
};

ViewController.prototype.renderPost = function(postDOMElement) {
  var parent = document.getElementsByClassName('blog-body__content')[0];
  parent.insertBefore(postDOMElement, parent.firstChild);
};

ViewController.prototype.handleSubmit = function(data) {
  this.addPost(data);
};

ViewController.prototype.addPost = function(data) {
  var postModel = new Post(data);
  var response = postModel.save();
  if (response.status === 200) {
    this.postCollection.push(postModel);
    if (!clickedUndoButton) {//don't want to increase actionsTrackerArray if undo button was clicked;
      addCounter(1, postModel.attributes.id, postModel.attributes.title, postModel.attributes.body);
    }
  }

  var elements = this.generatePostDOMElements([postModel]);
  this.renderPost(elements[0]);
}

removePost = function(id, title, body) {
  addCounter(2, id, title, body);
  API.remove(id);
  for (var i =0; i < that.postCollection.length; i++) {
    if (that.postCollection[i].attributes.id === id) {
      that.postCollection.splice(i,1);
    }
  };

  deletePost();
};


module.exports = ViewController;
