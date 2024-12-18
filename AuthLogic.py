import utils.DatabaseManager as DatabaseManager

def email_auth(email, passwd):
    db = DatabaseManager.DataBaseManager()
    try:
        query = 'SELECT * FROM users WHERE email = %s AND password = %s'
        result = db.execute_query(query, (email, passwd))
        print(result)
        

    except Exception as e:
        print(e)
        return False
    if(len(result) == 0):
        return False
    elif(len(result) == 1):
        return True

def sign_in_logic(username, email, passwd):
    try:
        db = DatabaseManager.DataBaseManager()
        query = 'INSERT INTO users (username, email, password) VALUES (%s, %s, %s)'
        result = db.execute_query(query, (username, email, passwd))
        return True
    except Exception as e:
        print(e)
        return False