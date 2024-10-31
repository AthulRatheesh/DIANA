import psycopg2 as pg2
class UserProfile():
    #Connect to DB
    def connect(self) :
        try:
            self.con = pg2.connect("postgresql://diana:AOoYlJHDrUHN8gSKBRvVOQh3kdZ6eyaw@dpg-csgdle08fa8c73fv7ji0-a.oregon-postgres.render.com/user_profile_0l1t")
            print("Connected to the database")
            self.cur = self.con.cursor()
            print(type(self.cur))
            return self.cur
        except Exception as e:
            print(e)


    def createUser(self, name, password, email):
        self.name = name
        self.password = password
        self.email = email
        try:
            command="INSERT INTO user_auth (name, email, password) VALUES (%s, %s, %s) RETURNING user_id"
            self.cur.execute(command, (name, email, password))
            self.user_id = self.cur.fetchone()[0]
            self.con.commit()
            print(self.user_id)
        except Exception as e:
            print(e)
            self.con.rollback()

    @staticmethod
    def checkUser(email, password):
        try:
            # Create a new connection for this check
            con = pg2.connect("postgresql://diana:AOoYlJHDrUHN8gSKBRvVOQh3kdZ6eyaw@dpg-csgdle08fa8c73fv7ji0-a.oregon-postgres.render.com/user_profile_0l1t")
            cur = con.cursor()
            command="SELECT * FROM user_auth WHERE email = %s AND password = %s"
            cur.execute(command, (email, password))
            result = cur.fetchone()
            cur.close()
            con.close()
            return bool(result)
        except Exception as e:
            print(e)
            return False
    
    @staticmethod
    def getUserId(email):
        try:
            # Create a new connection for this check
            con = pg2.connect("XXXXXXX")
            cur = con.cursor()
            command = "SELECT user_id FROM user_auth WHERE email = %s"
            cur.execute(command, (email,))  # Note the comma to make it a tuple
            result = cur.fetchone()
            cur.close()
            con.close()
            return result[0] if result else None
        except Exception as e:
            print(e)
            return None
    
            
        

    def __init__(self,name=None,password=None,email=None):
        self.con = None
        self.cur = None
        self.connect()
        #self.createUser(self.name, self.password, self.email)
