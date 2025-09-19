// client/src/services/roomService.ts (수정된 버전)
import axios from 'axios';
import { Room } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface UserData {
  soopId: string;
  nickname: string;
  profileImage: string;
  position: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK'; // 포지션 추가
}

export interface RoomCreateData {
  title: string;
  host: UserData; // UserData가 이미 position을 포함하므로 그대로 사용
  settings?: {
    password?: string;
    draftType?: 'shuffle' | 'snake' | 'manual';
  };
}

export interface RoomCreateResponse {
  success: boolean;
  message?: string;
  room: Room;
  userInfo: {
    userId: string;
    isHost: boolean;
  };
  error?: string;
}

export interface RoomJoinResponse {
  success: boolean;
  message?: string;
  room: Room;
  userInfo: {
    userId: string;
    isHost: boolean;
  };
  error?: string;
}

export interface RoomGetResponse {
  success: boolean;
  room: Room;
  error?: string;
}

export class RoomService {
  // 방 생성
  static async createRoom(data: RoomCreateData): Promise<RoomCreateResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/rooms`, data);
      return response.data;
    } catch (error: any) {
      console.error('방 생성 실패:', error);
      throw error;
    }
  }

  // 방 입장
  static async joinRoom(
    roomCode: string, 
    userData: UserData, 
    password?: string
  ): Promise<RoomJoinResponse> {
    try {
      const requestData = {
        user: userData,
        password: password || undefined
      };

      const response = await axios.post(`${API_BASE_URL}/rooms/${roomCode}/join`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('방 입장 실패:', error);
      throw error;
    }
  }

  // 방 정보 조회
  static async getRoomByCode(roomCode: string): Promise<RoomGetResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomCode}`);
      return response.data;
    } catch (error: any) {
      console.error('방 정보 조회 실패:', error);
      throw error;
    }
  }

  // 활성 방 목록 조회 (개발용)
  static async getActiveRooms(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms`);
      return response.data;
    } catch (error: any) {
      console.error('활성 방 목록 조회 실패:', error);
      throw error;
    }
  }
}

export default RoomService;