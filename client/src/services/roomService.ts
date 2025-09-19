// client/src/services/roomService.ts
import api from './api';
import { 
  Room, 
  RoomCreateResponse, 
  RoomJoinResponse, 
  CreateRoomForm, 
  JoinRoomForm,
  SoopProfile 
} from '../types';

export class RoomService {
  // 방 생성
  static async createRoom(data: CreateRoomForm, profile: SoopProfile): Promise<RoomCreateResponse> {
    const response = await api.post('/api/rooms', {
      title: data.title,
      host: {
        soopId: profile.soopId,
        nickname: profile.nickname,
        profileImage: profile.profileImage
      },
      settings: {
        password: data.password || null,
        draftType: data.draftType,
        timePerTurn: 30, // 기본값
        maxParticipants: 100 // 고정값
      }
    });
    return response.data;
  }

  // 방 조회
  static async getRoomByCode(roomCode: string): Promise<{ success: boolean; room: Room }> {
    const response = await api.get(`/api/rooms/${roomCode}`);
    return response.data;
  }

  // 방 입장
  static async joinRoom(roomCode: string, data: JoinRoomForm, profile: SoopProfile): Promise<RoomJoinResponse> {
    const response = await api.post(`/api/rooms/${roomCode}/join`, {
      user: {
        soopId: profile.soopId,
        nickname: profile.nickname,
        profileImage: profile.profileImage
      },
      password: data.password || null
    });
    return response.data;
  }

  // 활성 방 목록 조회
  static async getActiveRooms(): Promise<{ success: boolean; count: number; rooms: Room[] }> {
    const response = await api.get('/api/rooms');
    return response.data;
  }
}