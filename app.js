const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const firebaseRef = firebase.database().ref("WhatsApp Clone");
let me = "";
let showTopChat = true;

window.onload = function () {
    document.querySelector('.logIn-btn').addEventListener("click", function (e) {
        auth.signInWithPopup(provider)
    })

    document.querySelector('.text-input').addEventListener("input", e => {
        if (document.querySelector('.text-input').value.trim() == "")
            document.querySelector(".mic").src = "./mic.png";
        else
            document.querySelector(".mic").src = "./send-btn.png";
    })

    auth.onAuthStateChanged(authSnap => {
        if (authSnap) {
            console.log("Signed In")
            firebaseRef.child("Profiles").child(authSnap.providerData[0].email.substring(0, authSnap.providerData[0].email.indexOf("@"))).set({
                name: authSnap.providerData[0].displayName,
                profile_picture: authSnap.providerData[0].photoURL,
                uid: authSnap.providerData[0].uid
            })
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
                    last_text.textContent = "Hey There! I am using WhatsApp";
                    chat.addEventListener('click', function () {
                        openChat(snap.val().profile_picture, snap.val().name, snap.key, me)
                    })

                    main_element.appendChild(chat);
                    chat.appendChild(img);
                    chat.appendChild(chat_info);
                    chat_info.appendChild(title);
                    chat_info.appendChild(last_text);

                    if (showTopChat) {
                        openChat(snap.val().profile_picture, snap.val().name, snap.key, me);
                        showTopChat = false;
                    }
                }
            });
        }
    });

}

let chat_updater = firebaseRef,
    chat_server = "";

function openChat(their_profile_picture, their_name, their_email, my_email) {
    document.querySelector(".login-page").style.transform = "translateY(-100%)";
    if (!showTopChat) {
        setTimeout(function () {
            document.querySelector(".text-input").focus();
        }, 400)
        document.querySelector(".chat-box").style.transform = "translateX(0)";
    }
    chat_updater.off();
    document.querySelector(".chat-body").innerHTML = "";

    document.querySelector(".chat-header .profile-picture").src = their_profile_picture;
    document.querySelector(".chat-header .title").textContent = their_name;

    if (their_email.localeCompare(my_email) < 0)
        chat_server = their_email + my_email;
    else
        chat_server = my_email + their_email;

    chat_updater = firebaseRef.child("user-garbage").child(chat_server);
    firebaseRef.child("user-garbage").child(chat_server).on("child_added", function (snapshot) {
        const chat_body = document.querySelector(".chat-body");
        const message_holder = document.createElement("div");
        const text = document.createElement("div");
        const time_stamp = document.createElement("div");
        const triangle = document.createElement("img");

        message_holder.className = "message-holder";
        text.className = "text";
        time_stamp.className = "time-stamp";
        triangle.className = "triangle";

        if (snapshot.val().sender == me) {
            triangle.classList.add("my");
            triangle.src = "./my text triangle.png";
            text.classList.add("my-msg");
        } else {
            triangle.classList.add("their");
            triangle.src = "./their text triangle.png";
            text.classList.add("their-msg");
        }

        text.textContent = snapshot.val().text;
        time_stamp.textContent = snapshot.val().timeStamp;

        chat_body.appendChild(message_holder);
        message_holder.appendChild(text);
        text.appendChild(time_stamp);
        text.appendChild(triangle);

        chat_body.scrollTo(0, chat_body.clientHeight)
    })
}

document.querySelector(".mic").addEventListener('click', function () {
    if (document.querySelector('.text-input').value.trim() != "") {
        firebaseRef.child("user-garbage").child(chat_server).push({
            sender: me,
            text: document.querySelector(".text-input").value.trim(),
            timeStamp: new Date().getHours() + ":" + new Date().getMinutes()
        });
        document.querySelector(".text-input").focus();
        document.querySelector(".text-input").value = "";
    }
})

document.querySelector(".text-input").addEventListener('keypress', function (e) {
    if (e.key == "Enter") {
        if (document.querySelector('.text-input').value.trim() != "") {
            firebaseRef.child("user-garbage").child(chat_server).push({
                sender: me,
                text: document.querySelector(".text-input").value.trim(),
                timeStamp: new Date().getHours() + ":" + new Date().getMinutes()
            });
            document.querySelector(".text-input").focus();
            document.querySelector(".text-input").value = "";
        }
    }
})

document.querySelector(".search-box .search").addEventListener("input", function () {
    let i = 0;
    document.querySelectorAll(".chat").forEach((elem, index) => {
        i++;
        if (!document.querySelector(".chat:nth-child(" + i + ") .chat-info .title").innerHTML.toLowerCase().includes(document.querySelector(".search-box .search").value.toLowerCase())) {
            document.querySelector(".chat:nth-child(" + i + ")").style.display = "none";
        } else {
            document.querySelector(".chat:nth-child(" + i + ")").style.display = "block";
        }
    })
})

document.querySelector(".back-btn").addEventListener("click", () => {
    document.querySelector(".chat-box").style.transform = "translateX(100%)"
})