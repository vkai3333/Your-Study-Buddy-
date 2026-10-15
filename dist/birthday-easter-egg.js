(() => {
  const PROFILE_KEY = "your-study-buddy-profile-v1";
  const celebration = document.getElementById("birthday-celebration");
  const layer = document.getElementById("birthday-confetti");
  if (!celebration || !layer) return;
  let profile;
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return; }
  if (!profile?.birthday) return;
  const [month, day] = String(profile.birthday).split("-").slice(-2).map(Number);
  const today = new Date();
  if (today.getMonth() + 1 !== month || today.getDate() !== day) return;
  const colors = ["#5b5bd6", "#8b7cf6", "#f2b84b", "#ef6f61", "#37b98b", "#4d98e8"];
  layer.innerHTML = Array.from({ length: 72 }, (_, index) => `<i style="--left:${1.5 + (index * 31.7) % 97}%;--top:${5 + (index * 19.3) % 90}%;--color:${colors[index % colors.length]};--size:${5 + (index % 4) * 2}px;--rotation:${(index * 47) % 180}deg"></i>`).join("");
  const name = String(profile.name || "").replace(/[&<>"']/g, "");
  document.getElementById("birthday-message").textContent = `Happy Birthday${name ? `, ${name}` : ""}!`;
  document.body.classList.add("birthday-today");
  if (!document.querySelector(".dashboard-grid")?.hidden) celebration.hidden = false;
})();
