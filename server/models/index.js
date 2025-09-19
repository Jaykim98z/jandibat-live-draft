// server/models/index.js - 모든 모델 내보내기
const Room = require('./Room');
const Draft = require('./Draft');
const ChatMessage = require('./ChatMessage');

module.exports = {
  Room,
  Draft,
  ChatMessage
};