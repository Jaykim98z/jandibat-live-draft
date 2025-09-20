// server/controllers/roomController.js (완전한 최종 버전)
const { Room } = require('../models');

// 방 코드 생성 함수
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 방 생성
const createRoom = async (req, res) => {
  try {
    const { title, settings, host } = req.body;

    // 입력 검증
    if (!title || !host || !host.soopId || !host.nickname || !host.position) {
      return res.status(400).json({
        error: '방 제목, 호스트 정보, 포지션이 필요합니다.',
        required: ['title', 'host.soopId', 'host.nickname', 'host.position']
      });
    }

    // 포지션 유효성 검사
    const validPositions = ['ST', 'WF', 'CM', 'CDM', 'FB', 'CB', 'GK'];
    if (!validPositions.includes(host.position)) {
      return res.status(400).json({
        error: '올바른 포지션을 선택해주세요.',
        validPositions
      });
    }

    // 고유한 방 코드 생성
    let roomCode;
    let existingRoom;
    do {
      roomCode = generateRoomCode();
      existingRoom = await Room.findOne({ code: roomCode });
    } while (existingRoom);

    // userId 생성
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 방 생성
    const room = new Room({
      code: roomCode,
      title: title.trim(),
      host: {
        userId,
        soopId: host.soopId,
        nickname: host.nickname,
        profileImage: host.profileImage || '',
        position: host.position
      },
      settings: {
        password: settings?.password || null,
        draftType: settings?.draftType || 'shuffle',
        maxParticipants: 100
      },
      participants: [{
        userId,
        soopId: host.soopId,
        nickname: host.nickname,
        profileImage: host.profileImage || '',
        position: host.position,
        role: 'player', // 기본값은 선수
        isHost: true,
        isReady: true
      }]
    });

    await room.save();

    console.log(`🏠 새 방 생성: ${roomCode} - ${title} (방장: ${host.nickname}/${host.position})`);

    res.status(201).json({
      success: true,
      message: '방이 성공적으로 생성되었습니다.',
      room: {
        id: room._id,
        code: room.code,
        title: room.title,
        host: room.host,
        settings: room.settings,
        status: room.status,
        participants: room.participants,
        participantCount: room.participants.length,
        managerCount: room.participants.filter(p => p.role === 'manager').length,
        playerCount: room.participants.filter(p => p.role === 'player').length,
        canStartDraft: false
      },
      userInfo: {
        userId,
        isHost: true
      }
    });

  } catch (error) {
    console.error('❌ 방 생성 오류:', error);
    res.status(500).json({
      error: '방 생성 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 방 조회 (코드로)
const getRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      return res.status(400).json({
        error: '유효하지 않은 방 코드입니다.',
        message: '방 코드는 6자리여야 합니다.'
      });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({
        error: '방을 찾을 수 없습니다.',
        message: '방 코드를 확인해주세요.'
      });
    }

    res.json({
      success: true,
      room: {
        id: room._id,
        code: room.code,
        title: room.title,
        host: room.host,
        settings: {
          ...room.settings,
          password: room.settings.password ? '***' : null
        },
        status: room.status,
        participants: room.participants,
        participantCount: room.participants.length,
        managerCount: room.participants.filter(p => p.role === 'manager').length,
        playerCount: room.participants.filter(p => p.role === 'player').length,
        canStartDraft: room.canStartDraft,
        createdAt: room.createdAt
      }
    });

  } catch (error) {
    console.error('❌ 방 조회 오류:', error);
    res.status(500).json({
      error: '방 조회 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 방 입장
const joinRoom = async (req, res) => {
  try {
    const { code } = req.params;
    const { user, password } = req.body;

    // 입력 검증
    if (!user || !user.soopId || !user.nickname || !user.position) {
      return res.status(400).json({
        error: '사용자 정보와 포지션이 필요합니다.',
        required: ['user.soopId', 'user.nickname', 'user.position']
      });
    }

    // 포지션 유효성 검사
    const validPositions = ['ST', 'WF', 'CM', 'CDM', 'FB', 'CB', 'GK'];
    if (!validPositions.includes(user.position)) {
      return res.status(400).json({
        error: '올바른 포지션을 선택해주세요.',
        validPositions
      });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({
        error: '방을 찾을 수 없습니다.'
      });
    }

    // 비밀번호 확인
    if (room.settings.password && room.settings.password !== password) {
      return res.status(401).json({
        error: '비밀번호가 틀렸습니다.'
      });
    }

    // 방이 가득 찼는지 확인
    if (room.participants.length >= room.settings.maxParticipants) {
      return res.status(400).json({
        error: '방이 가득 찼습니다. (최대 100명)'
      });
    }

    // 이미 참가 중인지 확인
    const existingParticipant = room.participants.find(p => p.soopId === user.soopId);
    if (existingParticipant) {
      return res.json({
        success: true,
        message: '이미 참가 중인 방입니다.',
        room: {
          id: room._id,
          code: room.code,
          title: room.title,
          host: room.host,
          participants: room.participants,
          participantCount: room.participants.length,
          managerCount: room.participants.filter(p => p.role === 'manager').length,
          playerCount: room.participants.filter(p => p.role === 'player').length,
          canStartDraft: room.canStartDraft
        },
        userInfo: {
          userId: existingParticipant.userId,
          isHost: existingParticipant.isHost
        }
      });
    }

    // 새 참가자 추가
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    room.participants.push({
      userId,
      soopId: user.soopId,
      nickname: user.nickname,
      profileImage: user.profileImage || '',
      position: user.position,
      role: 'player', // 기본값은 선수
      isHost: false,
      isReady: false
    });

    await room.save();

    console.log(`👥 방 입장: ${user.nickname}(${user.position}) → ${room.code}`);

    res.json({
      success: true,
      message: '방에 성공적으로 입장했습니다.',
      room: {
        id: room._id,
        code: room.code,
        title: room.title,
        host: room.host,
        participants: room.participants,
        participantCount: room.participants.length,
        managerCount: room.participants.filter(p => p.role === 'manager').length,
        playerCount: room.participants.filter(p => p.role === 'player').length,
        canStartDraft: room.canStartDraft
      },
      userInfo: {
        userId,
        isHost: false
      }
    });

  } catch (error) {
    console.error('❌ 방 입장 오류:', error);
    res.status(500).json({
      error: '방 입장 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 활성화된 방 목록 조회 (개발용)
const getActiveRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 
      status: { $in: ['waiting', 'drafting'] } 
    })
    .select('code title host participantCount status createdAt')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      count: rooms.length,
      rooms: rooms.map(room => ({
        code: room.code,
        title: room.title,
        host: `${room.host.nickname}(${room.host.position})`,
        participants: room.participants?.length || 0,
        status: room.status,
        createdAt: room.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ 활성 방 목록 조회 오류:', error);
    res.status(500).json({
      error: '방 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 역할 배정 (방장만)
const assignRole = async (req, res) => {
  try {
    const { code } = req.params;
    const { userId, role, requesterId } = req.body;

    // 입력 검증
    if (!userId || !role || !requesterId) {
      return res.status(400).json({
        error: '사용자 ID, 역할, 요청자 ID가 필요합니다.',
        required: ['userId', 'role', 'requesterId']
      });
    }

    if (!['manager', 'player'].includes(role)) {
      return res.status(400).json({
        error: '올바른 역할을 선택해주세요.',
        validRoles: ['manager', 'player']
      });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({
        error: '방을 찾을 수 없습니다.'
      });
    }

    // 방장 권한 확인
    if (room.host.userId !== requesterId) {
      return res.status(403).json({
        error: '방장만 역할을 배정할 수 있습니다.'
      });
    }

    // 역할 배정
    const success = room.assignRole(userId, role);
    if (!success) {
      return res.status(404).json({
        error: '해당 참가자를 찾을 수 없습니다.'
      });
    }

    await room.save();

    console.log(`👥 역할 배정: ${userId} → ${role} (방: ${code})`);

    res.json({
      success: true,
      message: '역할이 성공적으로 배정되었습니다.',
      room: {
        id: room._id,
        code: room.code,
        participants: room.participants,
        managers: room.managers,
        playerPool: room.playerPool,
        managerCount: room.participants.filter(p => p.role === 'manager').length,
        playerCount: room.participants.filter(p => p.role === 'player').length,
        canStartDraft: room.canStartDraft
      }
    });

  } catch (error) {
    console.error('❌ 역할 배정 오류:', error);
    res.status(500).json({
      error: '역할 배정 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 자동 역할 배정 (방장만)
const autoAssignRoles = async (req, res) => {
  try {
    const { code } = req.params;
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({
        error: '요청자 ID가 필요합니다.'
      });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({
        error: '방을 찾을 수 없습니다.'
      });
    }

    // 방장 권한 확인
    if (room.host.userId !== requesterId) {
      return res.status(403).json({
        error: '방장만 자동 역할 배정을 할 수 있습니다.'
      });
    }

    // 자동 역할 배정 실행
    room.autoAssignRoles();
    await room.save();

    console.log(`🎲 자동 역할 배정 완료 (방: ${code})`);

    res.json({
      success: true,
      message: '자동 역할 배정이 완료되었습니다.',
      room: {
        id: room._id,
        code: room.code,
        participants: room.participants,
        managers: room.managers,
        playerPool: room.playerPool,
        managerCount: room.participants.filter(p => p.role === 'manager').length,
        playerCount: room.participants.filter(p => p.role === 'player').length,
        canStartDraft: room.canStartDraft
      }
    });

  } catch (error) {
    console.error('❌ 자동 역할 배정 오류:', error);
    res.status(500).json({
      error: '자동 역할 배정 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 역할 통계 조회
const getRoleStats = async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({
        error: '방을 찾을 수 없습니다.'
      });
    }

    const managerCount = room.participants.filter(p => p.role === 'manager').length;
    const playerCount = room.participants.filter(p => p.role === 'player').length;
    const allReady = room.participants.every(p => p.isReady);

    res.json({
      success: true,
      stats: {
        totalParticipants: room.participants.length,
        managerCount,
        playerCount,
        allReady,
        canStartDraft: managerCount >= 2 && playerCount >= 1 && allReady,
        requirements: {
          minManagers: 2,
          minPlayers: 1,
          needsAllReady: true
        }
      }
    });

  } catch (error) {
    console.error('❌ 역할 통계 조회 오류:', error);
    res.status(500).json({
      error: '역할 통계 조회 중 오류가 발생했습니다.'
    });
  }
};

// 드래프트 시작 (방장만)
const startDraft = async (req, res) => {
  try {
    const { code } = req.params;
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({
        error: '요청자 ID가 필요합니다.'
      });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({
        error: '방을 찾을 수 없습니다.'
      });
    }

    // 방장 권한 확인
    if (room.host.userId !== requesterId) {
      return res.status(403).json({
        error: '방장만 드래프트를 시작할 수 있습니다.'
      });
    }

    // 드래프트 시작 조건 확인
    const managerCount = room.participants.filter(p => p.role === 'manager').length;
    const playerCount = room.participants.filter(p => p.role === 'player').length;
    const allReady = room.participants.every(p => p.isReady);

    if (managerCount < 2) {
      return res.status(400).json({
        error: '감독이 최소 2명 이상 필요합니다.',
        current: managerCount,
        required: 2
      });
    }

    if (playerCount < 1) {
      return res.status(400).json({
        error: '선수가 최소 1명 이상 필요합니다.',
        current: playerCount,
        required: 1
      });
    }

    if (!allReady) {
      return res.status(400).json({
        error: '모든 참가자가 준비 상태여야 합니다.'
      });
    }

    // 드래프트 시작
    room.status = 'drafting';
    await room.save();

    console.log(`🎯 드래프트 시작 (방: ${code}) - 감독: ${managerCount}명, 선수: ${playerCount}명`);

    res.json({
      success: true,
      message: '드래프트가 시작되었습니다!',
      room: {
        id: room._id,
        code: room.code,
        status: room.status,
        managers: room.managers,
        playerPool: room.playerPool
      }
    });

  } catch (error) {
    console.error('❌ 드래프트 시작 오류:', error);
    res.status(500).json({
      error: '드래프트 시작 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

module.exports = {
  createRoom,
  getRoomByCode,
  joinRoom,
  getActiveRooms,
  assignRole,
  autoAssignRoles,
  getRoleStats,
  startDraft
};