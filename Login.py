import streamlit as st
from utils.AuthLogic import email_auth
      

def display_loginpage():
    with st.form("Login_Form"):
                st.title("Login")
                username = st.text_input("Username", key="username")
                email = st.text_input("Email", key="email")
                passwd = st.text_input("Password", type="password")
                if st.form_submit_button("Login"):
                    st.switch_page("pages/Home.py")

                st.markdown("Don't have an account? [Register](/Sign_In)")

    if username and email and passwd:
        if email_auth(email, passwd):
            st.session_state['is_authenticated']=True
            st.success("Login successful")
        else:
            st.error("Login failed..")
