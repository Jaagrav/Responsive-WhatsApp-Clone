const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const firebaseRef = firebase.database().ref("WhatsApp Clone");
let me = "";
let showTopChat = true;

window.onload = function () {
    document.querySelector('.logIn-btn').addEventListener("click", function (e) {
        auth.signInWithPopup(provider);//Authorization with Google Sign In
    });

    document.querySelector('.text-input').addEventListener("input", e => {
        if (document.querySelector('.text-input').value.trim() == "")
            document.querySelector(".mic").src = "./mic.png";
        else
            document.querySelector(".mic").src = "./send-btn.png";
    });

    auth.onAuthStateChanged(authSnap => {
        if (authSnap) {
            firebaseRef.child("Profiles").child(authSnap.providerData[0].email.substring(0, authSnap.providerData[0].email.indexOf("@"))).set({
                name: authSnap.providerData[0].displayName,
                profile_picture: authSnap.providerData[0].photoURL,
                uid: authSnap.providerData[0].uid
            });
            me = authSnap.providerData[0].email.substring(0, authSnap.providerData[0].email.indexOf("@"));
            document.querySelector(".my-profile-picture").src = authSnap.providerData[0].photoURL;

            firebaseRef.child("Profiles").on("child_added", function (snap) {
                if (me != snap.key) {
                    const main_element = document.querySelector(".chats");
                    const chat = document.createElement("div");
                    const chat_info = document.createElement("div");
                    const img = document.createElement("img");
                    const title = document.createElement("div");
                    const last_text = document.createElement("div");

                    chat.className = "chat";
                    img.className = "profile-picture";
                    chat_info.className = "chat-info";
                    title.className = "title";
                    last_text.className = "last-text";

                    img.src = snap.val().profile_picture;
                    title.textContent = snap.val().name;
                    last_text.textContent = "No new messages";
                    last_text.classList.add(snap.key);
                    chat.addEventListener('click', function () {
                        openChat(snap.val().profile_picture, snap.val().name, snap.key, me);
                        document.querySelector(".chat-box").style.transform = "translateX(0)";
                    })
                    let cs = "";
                    cs = (snap.key.localeCompare(me) < 0) ? (snap.key + me) : (me + snap.key);
                    firebaseRef.child("user-garbage").child(cs).on("child_added", lasttext => {
                        let sentBy = "";
                        firebaseRef.child("Profiles").child(lasttext.val().sender).once('value').then(ss => {
                            sentBy = ss.val().name;
                            if (lasttext.val().sender == me)
                                last_text.textContent = "You: " + lasttext.val().text;
                            else last_text.textContent = sentBy.substring(0, sentBy.indexOf(" ")) + ": " + lasttext.val().text;
                        });

                    });//Last Text Sent displayed using this

                    main_element.appendChild(chat);
                    chat.appendChild(img);
                    chat.appendChild(chat_info);
                    chat_info.appendChild(title);
                    chat_info.appendChild(last_text);//Show the chat blocks

                    if (showTopChat) {
                        openChat(snap.val().profile_picture, snap.val().name, snap.key, me);
                        showTopChat = false;
                    }
                }
            });
        } else {
            document.querySelector(".login-page").style.transform = "translateY(0)";
        }
    });

}

let chat_updater = firebaseRef,
    chat_server = "",
    callback;

function openChat(their_profile_picture, their_name, their_email, my_email) {
    document.querySelector(".chat-body").style.scrollBehavior = "auto";
    document.querySelector(".login-page").style.transform = "translateY(-100%)";
    chat_updater.off("child_added", callback);
    document.querySelector(".chat-body").innerHTML = "";

    document.querySelector(".chat-header .profile-picture").src = their_profile_picture;
    document.querySelector(".chat-header .title").textContent = their_name;

    if (their_email.localeCompare(my_email) < 0)
        chat_server = their_email + my_email;
    else
        chat_server = my_email + their_email;

    chat_updater = firebaseRef.child("user-garbage").child(chat_server);
    callback = function (snapshot) {
        const chat_body = document.querySelector(".chat-body");
        const message_holder = document.createElement("div");
        const text = document.createElement("div");
        const time_stamp = document.createElement("div");
        const triangle = document.createElement("svg");

        message_holder.className = "message-holder";
        text.className = "text";
        time_stamp.className = "time-stamp";
        triangle.className = "triangle";

        if (snapshot.val().sender == me) {
            triangle.classList.add("my");
            triangle.innerHTML = '<svg width="20" height="20" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M58.5129 26.9913C59.9147 24.9949 58.4742 22.249 56.0349 22.2675L4.35559 22.6596C2.10991 22.6766 0.678455 25.0644 1.72168 27.0531L23.7032 68.957C24.7464 70.9457 27.5246 71.1252 28.8151 69.2873L58.5129 26.9913Z" fill="#DAF9C7"/></svg>';
            text.classList.add("my-msg");
        } else {
            triangle.classList.add("their");
            triangle.innerHTML = '<svg width="20" height="20" viewBox="0 0 71 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5977 27.0302C11.1894 25.0383 12.6209 22.2878 15.0603 22.2983L66.7406 22.522C68.9863 22.5317 70.4255 24.9148 69.3888 26.9069L47.544 68.8822C46.5072 70.8743 43.7297 71.0628 42.4332 69.2291L12.5977 27.0302Z" fill="white"/></svg>';
            text.classList.add("their-msg");
        }//Show the chat heads, ie the chat-sides text messages

        text.textContent = snapshot.val().text;
        time_stamp.textContent = snapshot.val().timeStamp;

        chat_body.appendChild(message_holder);
        message_holder.appendChild(text);
        text.appendChild(time_stamp);
        text.appendChild(triangle);

        chat_body.scrollTop = chat_body.scrollHeight;
        setTimeout(() => {
            chat_body.style.scrollBehavior = "smooth";
        }, 300)
    }
    chat_updater.on("child_added", callback)
}

document.querySelector(".mic").addEventListener('click', function () {
    if (document.querySelector('.text-input').value.trim() != "") {
        document.querySelector(".text-input").focus();
        firebaseRef.child("user-garbage").child(chat_server).push({
            sender: me,
            text: document.querySelector(".text-input").value.trim(),
            timeStamp: new Date().getHours() + ":" + new Date().getMinutes()
        });
        //TODO Fix TimeStamp
        document.querySelector(".text-input").value = "";
    }
});

document.querySelector(".text-input").addEventListener('keypress', function (e) {
    if (e.key == "Enter") {
        document.querySelector(".text-input").focus();
        if (document.querySelector('.text-input').value.trim() != "") {
            firebaseRef.child("user-garbage").child(chat_server).push({
                sender: me,
                text: document.querySelector(".text-input").value.trim(),
                timeStamp: new Date().getHours() + ":" + new Date().getMinutes()
            });
            document.querySelector(".text-input").value = "";
        }
    }
});

document.querySelector(".search-box .search").addEventListener("input", function () {
    let i = 0;
    document.querySelectorAll(".chat").forEach((elem, index) => {
        i++;
        if (!document.querySelector(".chat:nth-child(" + i + ") .chat-info .title").innerHTML.toLowerCase().includes(document.querySelector(".search-box .search").value.toLowerCase())) {
            document.querySelector(".chat:nth-child(" + i + ")").style.display = "none";
        } else {
            document.querySelector(".chat:nth-child(" + i + ")").style.display = "block";
        }
    });
});

document.querySelector(".back-btn").addEventListener("click", () => {
    document.querySelector(".chat-box").style.transform = "translateX(100%)"
});

document.querySelector(".menu-btn").addEventListener("click", () => {
    document.querySelector(".menu").classList.toggle("closed")
});

let theme = true;
document.querySelector(".theme-toggle").addEventListener('click', function () {
    if (theme) {
        document.querySelector(".menu").classList.toggle("closed")
        document.querySelector(".theme-toggle").textContent = "Light Theme";
        document.documentElement.style.setProperty(
            "--background-color",
            "#E5DDD5"
        );
        document.documentElement.style.setProperty(
            "--header-footer-color",
            "#EEEEEE"
        );
        document.documentElement.style.setProperty(
            "--input-color",
            "#FFFFFF"
        );
        document.documentElement.style.setProperty(
            "--input-inside-color",
            "#FFFFFF"
        );
        document.documentElement.style.setProperty(
            "--search-box-color",
            "#FCFCFC"
        );
        document.documentElement.style.setProperty(
            "--text-color",
            "#000000"
        );
        document.documentElement.style.setProperty(
            "--their-text-chats-color",
            "#FFFFFF"
        );
        document.documentElement.style.setProperty(
            "--my-text-chats-color",
            "#DAF9C7"
        );
        document.documentElement.style.setProperty(
            "--chat-bg-opacity",
            "0.4"
        );
        theme = false;
    } else {
        document.querySelector(".menu").classList.toggle("closed")
        document.querySelector(".theme-toggle").textContent = "Dark Theme";
        document.documentElement.style.setProperty(
            "--background-color",
            "#0D1418"
        );
        document.documentElement.style.setProperty(
            "--header-footer-color",
            "#2A2F32"
        );
        document.documentElement.style.setProperty(
            "--input-color",
            "#131C21"
        );
        document.documentElement.style.setProperty(
            "--input-inside-color",
            "#323739"
        );
        document.documentElement.style.setProperty(
            "--search-box-color",
            "#1E2428"
        );
        document.documentElement.style.setProperty(
            "--text-color",
            "#FFF"
        );
        document.documentElement.style.setProperty(
            "--their-text-chats-color",
            "#1E2428"
        );
        document.documentElement.style.setProperty(
            "--my-text-chats-color",
            "#054740"
        );
        document.documentElement.style.setProperty(
            "--chat-bg-opacity",
            "0.1"
        );
        theme = true;
    }
})
resize();

window.addEventListener('resize', function () {
    resize();
})

function resize() {
    if (window.innerWidth > 768)
        document.querySelector(".chat-box").style.transform = "translateX(0px)";
    if (window.innerWidth < 768)
        document.querySelector(".menu-btn").src = "./menu-btn-mobile.png"
    else
        document.querySelector(".menu-btn").src = "./menu-btn.png";
}

document.querySelector(".log-out").addEventListener("click", () => {
    auth.signOut().then(snap => {
        window.location.reload();
    });
})
