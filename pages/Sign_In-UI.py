import streamlit as st
# Add the backend directory to Python path
from ..backend import Create_User as cu
st.set_page_config(page_title="Sign In")
st.title("Sign In")
name=st.text_input(type="default",label="Name")
password=st.text_input(type="password",label="Password")
email=st.text_input(label="Email", type="default")
if st.button("Sign In"):
    user = cu.UserProfile(name,password,email)
    st.session_state["User"]=user
    st.success("Signed in successfully")
    st.switch_page("pages/Home.py")