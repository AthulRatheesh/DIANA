import streamlit as st
import utils.AuthLogic as AuthLogic

def display_sign_up():

    with st.form("Sign-up"):
        st.title("Sign Up")
        username = st.text_input("Username", key="username")
        passwd = st.text_input("Password", key="password", type="password")
        email = st.text_input("Email", key="email")
        st.form_submit_button("Sign Up")
    
    if username and passwd and email:
        if AuthLogic.email_auth(email, passwd):
            st.error("User already exists with this email")
        else:
            if AuthLogic.sign_in_logic(username, email, passwd):
                st.session_state['is_authenticated']=True

                st.success("User created successfully")

display_sign_up()