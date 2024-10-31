import streamlit as st
from backend.Create_User import UserProfile
def login_function(email,password):
    st.session_state["logged_in"] = False
    #user = cu.UserProfile()
    if UserProfile.checkUser(email, password) == True:
        st.session_state["logged_in"] = True
        st.session_state["user"] = UserProfile.getUserId(email)
        st.session_state["email"] = email
        st.session_state["password"] = password

with st.form("Login:"):
    email=st.text_input("Email")
    password=st.text_input("Password",type="password")
    if st.form_submit_button("Login"):
        login_function(email, password)
        st.switch_page("pages/Home.py")
    
