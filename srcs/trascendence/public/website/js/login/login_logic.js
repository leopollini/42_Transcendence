import { showInfoModal } from "../modal.js";
import { remove_all } from "../error_main.js";
import { navigate, save_global, token} from "../main.js";
import { update_image, change_name} from "../pages/modes.js"

export default function Callback() {
  return `
    `;
}

export async function addCallbackPageHandlers() {
  let let_me_in = await checkAuthentication(window.location.pathname);
  if (let_me_in === 1) {
    await navigate("/", "Home");
    return (1);
  }
  else if (let_me_in === -1) {
    await navigate("/modes", "Return to Game Mode");
    return (1);
  }
}

async function checkAuthentication() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      showInfoModal("Missing OAuth parameters.", () => { });
      navigate("/", "Return to home");
      remove_all(0, 0, 1);
      return;
    }
    const response = await fetch('/api/callback?' + params.toString());
    const data = await response.json();

    console.log("data: ", data);
    if (data.success) {
      save_global("name", data.realname);
      showInfoModal(data.message, () => { });
      await get_data();
      navigate("/modes", "Modalità di gioco");
    } else {
      showInfoModal("Autenticazione fallita: " + (data.error || "Unknown Error"), () => {
      });
      navigate("/", "Return to home");
      remove_all(0, 0, 1);
    }
  } catch (error) {
    showInfoModal("Errore durante la gestione del callback: " + error.message, () => { });
    remove_all(0, 0, 1);
    navigate("/", "Return to home");
  }
}

async function get_data() {
  try {
    const data = JSON.stringify({ "params": { "display_name": user_name }, "token": token });
    const response = await fetch("http://localhost:8008", {
      method: "get_user",
      body: data
    })
    const result = await response.json();
    console.log("(GET_USER)\ndata login = ", result);
    save_global("token", data.token);
    if (result && result.status === "true") {
      let new_user =
      {
        email: result.email,
        login_name: result.display_name,
        realname: result.realname,
        image: result.image,
        bio: result.bio,
        type: "login"
      };
      remove_all(1, 1);
      change_name(new_user.login_name);
      update_image(new_user.image);
      return;
    }
    else {
      remove_all(0, 0, 1);
      if (window.location.pathname !== '/')
        navigate("/", "home");
      showInfoModal("ERROR Login GET_USER: An error has occured(\"" + data.status + "\")", () => { });;
      return;
    }
  }
  catch (error) {
    remove_all(0, 0, 1);
    if (window.location.pathname !== '/')
      navigate("/", "home");
    showInfoModal("Error during Login in get_user: " + error.message, () => { });
    return;
  }
}

export async function performLogin() {
  try {
    const response = await fetch('/auth/login');
    const data = await response.json();
    console.log("data = ", data);
    if (data.auth_url) {
      window.location.href = data.auth_url;
    } else
      throw new Error("No auth_url received");

  } catch (error) {
    showInfoModal("Error during login: " + error.message, () => { });
  }
}
