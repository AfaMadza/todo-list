#!/usr/bin/env python3
"""
Flask App for Todo List MVP
"""
from flask import abort, Flask, jsonify
from flask import render_template, request, url_for
import json
from models import storage, Task, User, REQUIRED, PORT, HOST
import requests
from uuid import uuid4


# flask setup
app = Flask(__name__)
app.url_map.strict_slashes = False
ERRORS = [
    "Not a JSON", "Missing required information", "Missing id",
    "Wrong id type"
]

def api_response(state, message, code):
    """
    Method to handle errors with api
    """
    response = { state: message, "status_code": code }
    resp_json = jsonify(message)
    return resp_json

@app.teardown_appcontext
def teardown_db(exception):
    """
    after each request, this method calls .close() (i.e. .remove()) on
    the current SQLAlchemy Session
    """
    storage.close()

@app.route('/', methods=['GET'])
def main_index():
    """
    handles request to main index.html
    """
    if request.method == 'GET':
        cache_id = uuid4()
        return render_template('index.html', cache_id=cache_id)

def verify_proper_request(req_data):
    """
    verifies that proper request has been made
    """
    if req_data is None:
        return 0
    user_info = req_data.get('userInfo', None)
    if user_info is None:
        return 1
    fbid = user_info.get('fbid', None)
    if fbid is None:
        return 2
    if type(fbid) == 'int':
        return 3
    return fbid

def make_todo_task(verified_user):
    """
    makes JSON todo list for frontend
    """
    todo_list = {}
    todo_list['userInfo'] = verified_user.to_json()
    todo_list['allTasks'] = todo_list['userInfo'].pop('tasks')
    return todo_list

@app.route('/api', methods=['GET'])
def api_get_handler():
    """
    handles api get requests
    """
    req_data = request.get_json()
    verification = verify_proper_request(req_data)
    if type(verification).__name__ == "int":
        return api_response("error", ERRORS[verification], 400)
    all_users = storage.all('User').values()
    verified_user = None
    for user in all_users:
        this_fbid = User.text_decrypt(user.fbid)
        if verification == this_fbid:
            verified_user = user
            break
    if verified_user is None:
        return api_response("error", "Unknown id", 400)
    todo_list = make_todo_list(verified_user)
    return jsonify(todo_list), 201

def initialize_new_task_list(user_info, all_tasks):
    """
    initializes new task and user from POST request
    """
    new_user = User(**user_info)
    new_user.save()
    user_id = new_user.id
    for task in all_tasks.values():
        task['user_id'] = user_id
        new_task = Task(**task)
        new_task.save()
    return "new user and tasks created"

def update_user_tasks(verified_user, all_tasks):
    """
    updates user task information
    """
    user_id = verified_user.id
    user_tasks = verified_user.tasks
    user_task_ids = set([task.id for task in user_tasks])
    for task_id, task in all_tasks.items():
        if task_id in user_task_ids:
            verified_user.bm_update(task)
        else:
            task['user_id'] = user_id
            new_task = Task(**task)
            new_task.save()
    return "new tasks updated & created"

@app.route('/api', methods=['POST'])
def api_post_handler():
    """
    handles api post requests
    """
    req_data = request.get_json()
    verification = verify_proper_request(req_data)
    if type(verification).__name__ == "int":
        return api_response("error", ERRORS[verification], 400)
    user_info = req_data.get('userInfo', None)
    all_tasks = req_data.get('allTasks', None)
    if user_info is None or all_tasks is None:
        return api_response("error", "Missing required information", 400)
    for req in REQUIRED:
        if req not in user_info:
            return api_response("error", "Missing attribute", 400)
    all_users = storage.all('User').values()
    verified_user = None
    for user in all_users:
        this_fbid = User.text_decrypt(user.fbid)
        if verification == this_fbid:
            verified_user = user
            break
    if verified_user is None:
        message = initialize_new_task_list(user_info, all_tasks)
        return api_response("success", message, 200)
    else:
        message = update_user_tasks(verified_user, all_tasks)
        return api_response("success", message, 200)

@app.errorhandler(404)
def page_not_found(error):
    cache_id = uuid4()
    return render_template('404.html', cache_id=cache_id), 404


if __name__ == "__main__":
    """
    MAIN Flask App
    """
    app.run(host=HOST, port=PORT)
