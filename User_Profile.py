import streamlit as st
from PIL import Image
import io
import base64


def display_profile(username, email):
    # Set page configuration
    st.set_page_config(page_title="Profile Picture Upload")

    # Custom CSS for circular image and button styling
    st.markdown("""
        <style>
        .circular-image-container {
            width: 200px;
            height: 200px;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            border-radius: 50%;
            border: 3px solid #ccc;
        }
        .circular-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .profile-section {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        </style>
    """, unsafe_allow_html=True)

    # Initialize session state for showing/hiding uploader and storing image
    if 'show_uploader' not in st.session_state:
        st.session_state.show_uploader = False
    if 'profile_image' not in st.session_state:
        st.session_state.profile_image = None

    # Create two columns for the profile section
    col1, col2 = st.columns([1, 2])

    with col1:
        # Display profile picture if it exists
        if st.session_state.profile_image:
            st.markdown(f"""
                <div class="circular-image-container">
                    <img src="data:image/png;base64,{st.session_state.profile_image}" class="circular-image">
                </div>
            """, unsafe_allow_html=True)
        else:
            # Display empty circle or default image
            st.markdown("""
                <div class="circular-image-container">
                    <div style="width: 100%; height: 100%; background-color: #f0f0f0;"></div>
                </div>
            """, unsafe_allow_html=True)

    with col2:
        st.title("Profile Picture Upload")
        # Add the "Change profile picture" button
        st.button("Change profile picture", on_click=lambda: setattr(st.session_state, 'show_uploader', True))

    # Only show the file uploader if the button has been clicked
    if st.session_state.show_uploader:
        uploaded_file = st.file_uploader("Choose a profile picture", type=['jpg', 'jpeg', 'png'])
        
        # Add upload button
        if uploaded_file is not None:
            if st.button("Upload"):
                # Process the image
                image = Image.open(uploaded_file)
                
                # Create a square thumbnail
                min_size = min(image.size)
                offset_x = (image.width - min_size) // 2
                offset_y = (image.height - min_size) // 2
                image = image.crop((offset_x, offset_y, offset_x + min_size, offset_y + min_size))
                
                # Resize to slightly larger than display size
                image = image.resize((250, 250))
                
                # Convert image to base64
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                
                # Store the image in session state
                st.session_state.profile_image = img_str
                
                # Hide the uploader after successful upload
                st.session_state.show_uploader = False
                st.rerun()

    # Display name input field
    name = st.text_input('Name')
    if 'Name' not in st.session_state:
        st.session_state['Name'] = ''
    st.session_state['Name'] = name
    st.write(st.session_state['Name'])

display_profile("Trial1234","abc@xyz.com")



