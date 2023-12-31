const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const app = express();
const port = 5000;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let accessToken;
let refreshToken;
let accessTokenExpiresAt = 0;

// Пытаемся прочитать токен из файла при старте сервера
try {
  const tokenData = fs.readFileSync("token.json", "utf8");
  const parsedTokenData = JSON.parse(tokenData);
  accessToken = parsedTokenData.accessToken;
  refreshToken = parsedTokenData.refreshToken;
  accessTokenExpiresAt = parsedTokenData.accessTokenExpiresAt;
} catch (err) {
  console.error("Error reading token file:", err);
}

app.post("/getAmoCRMData", async (req, res) => {
  const { URL } = req.body;
  try {
    if (!accessToken || isTokenExpired()) {
      // Токен истек или не существует, обновляем его
      const { data } = await axios.post(
        //отправляем данные(кода авторизации и тд) чтобы получить токен
        `${URL}/oauth2/access_token`,
        req.body.data
      );
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      accessTokenExpiresAt = calculateAccessTokenExpiresAt(data.expires_in);

      // Записываем токен в файл
      const tokenData = {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
      };
      fs.writeFileSync("token.json", JSON.stringify(tokenData), "utf8");
    }
    //оправляем токен чтобы получить контакты
    const contactsResponse = await axios.get(`${URL}/api/v4/contacts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        with: "leads",
        limit: 20,
        page: 1,
      },
    });

    res.json(contactsResponse.data);
  } catch (error) {
    console.error(error);
    res
      .status(error.response ? error.response.status : 500)
      .json({ error: "Internal Server Error" });
  }
});

app.post("/sendingCRMTasks", async (req, res) => {
  const { URL, contacts } = req.body;
  //филтруем чтобы получить контакты без сделками
  let contactsWithoutDeals = contacts.filter(
    (contact) => !contact._embedded.leads
  );
  //проверяем у всех контактов есть сделки или нет
  let allContactsHaveLeads = contacts.every(
    (contact) => contact._embedded && contact._embedded.leads !== undefined
  );
  const tasksData = contactsWithoutDeals.map((contact) => ({
    text: "Контакт без сделок",
    complete_till: Math.floor(Date.now() / 1000) + 90000,
    entity_id: parseInt(contact.id, 10),
    entity_type: "contacts",
  }));
  const tasksArray = [...tasksData];

  if (allContactsHaveLeads !== true) {
    try {
      await axios.post(`${URL}/api/v4/tasks`, tasksArray, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      res.json({
        message: "You have successfully created a Contact without transactions",
        success: true,
      });
      return;
    } catch (error) {
      console.error(error.data);
      res
        .status(error.response ? error.response.status : 500)
        .json({ error: "Internal Server Error" });
    }
  }
  //если у всех контактов есть сделки
  else {
    res.json({ message: "All contacts have tasks", success: false });
    return;
  }
});

function isTokenExpired() {
  // Проверка на истечение срока действия токена
  const now = Math.floor(new Date() / 1000);
  return now >= accessTokenExpiresAt;
}

function calculateAccessTokenExpiresAt(expiresIn) {
  // Вычисляем время истечения токена на основе expiresIn, полученного от amoCRM
  const now = Math.floor(new Date() / 1000);
  return now + expiresIn;
}

setInterval(() => {
  // Обновляем время истечения токена каждые 12 часа
  accessTokenExpiresAt = Math.floor(new Date() / 1000) + 12 * 60 * 60;
}, 12 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
