document.addEventListener("DOMContentLoaded", () => {
  const submit = document.querySelector("#submit");
  const username = document.querySelector("#username");
  const name = document.querySelector("#name");
  const password = document.querySelector("#password");
  const result = document.querySelector(".result");
  submit.addEventListener("click", async () => {
    const user = {
      username: username.value,
      name: name.value,
      password: password.value,
    };

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(user),
    };
    try {
      result.innerHTML =
        "<h2>MOHON DITUNGGU SEHINGGA TIDAK TERJADI REGISTRASI 2 KALI</h2>";
      const fetchRes = await fetch("http://localhost:9000/register", options);
      if (!fetchRes.ok) throw new Error("SOMETHING WENT WRONG");
      result.innerHTML = "<h2>REGISTRASI BERHASIL</h2>";
    } catch (error) {
      result.innerHTML = `<h2>${error.message}</h2>`;
    }
  });
});
