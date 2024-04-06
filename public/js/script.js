document.addEventListener('DOMContentLoaded', () =>{
    document.getElementById('loginBlock').style.display = ""//show
    document.getElementById('loginButton').style.display= "none"//hide
    document.getElementById('registerButton').style.display= ""//show
    document.getElementById('registerBlock').style.display = "none"//hide
})

document.getElementById('loginButton').addEventListener('click', () =>{
    document.getElementById('loginBlock').style.display = ""//show
    document.getElementById('loginButton').style.display= "none"//hide
    document.getElementById('registerButton').style.display= ""//show
    document.getElementById('registerBlock').style.display = "none"//hide
})

document.getElementById('registerButton').addEventListener('click', () =>{
    document.getElementById('loginBlock').style.display = "none"
    document.getElementById('loginButton').style.display= ""
    document.getElementById('registerButton').style.display= "none"
    document.getElementById('registerBlock').style.display = ""
})