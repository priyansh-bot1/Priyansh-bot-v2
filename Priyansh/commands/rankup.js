const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promises: fsPromises } = require('fs');

const userDataPath = path.join(__dirname, 'cache', 'userData.json');

async function getUserName(api, senderID) {
  try {
    const userInfo = await api.getUserInfo(senderID);
    return userInfo[senderID]?.name || "User";
  } catch (error) {
    console.log(error);
    return "User";
  }
}

async function updateRankApi(senderID, name, currentExp, level) {
  
  const requiredXp = Math.floor(1000 * Math.pow(level, 2));

  const rankApiUrl = `https://rank2api-5faa0e644e2f.herokuapp.com/rankCard?name=${encodeURIComponent(name)}&level=Level${level}&color=auto&facebookSenderId=${senderID}&progress=69&rank=1&currentXp=${currentExp}&requiredXp=${requiredXp}&showXp=true`;

  try {
    const response = await axios.get(rankApiUrl, { responseType: 'arraybuffer' });

    const imagePath = path.join(__dirname, 'cache', `rankcard.jpeg`);
    await fsPromises.writeFile(imagePath, response.data, 'binary');

    return imagePath;
  } catch (error) {
    console.error('Error updating Rank API:', error.message);
    return null;
  }
}

module.exports.config = {
  name: "rankup",
  hasPermission: 0,
  version: "1.0.0",
  credits: "Jonell Magallanes",
  Description: "Announcement Rankup :>",
  usePrefix: true,
  commandCategory: "Rankup",
  usages: "?",
  cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
  let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  const userId = event.senderID;

  if (userData[userId]) {
    userData[userId].exp = (userData[userId].exp || 0) + 2;
    const expNeeded = Math.floor(5 * Math.pow(userData[userId].level || 1, 2));
    if (userData[userId].exp >= expNeeded) {
      userData[userId].level += 1;
      userData[userId].exp -= expNeeded;
      const rankLevel = userData[userId].level;
      const announcement = `⏫ | ${await getUserName(api, userId)} Your Keyboard Hero has leveled up to level ${rankLevel}! `;

      const imagePath = await updateRankApi(userId, await getUserName(api, userId), userData[userId].exp, rankLevel);

      if (imagePath) {
        api.sendMessage({
          body: announcement,
          attachment: fs.createReadStream(imagePath)
        }, event.threadID);
      } else {
        api.sendMessage(announcement, event.threadID);
      }
    }
  } else {
    userData[userId] = { exp: 1, level: 1 };
  }

  fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
}

module.exports.run = async function ({ api, event }) {
  api.sendMessage("This Command has rankup function", event.threadID);
};
