import { QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export default class User {
  id: string;
  userName: string;
  name: string;
  email: string;
  phoneNumber: string;
  imageUrl: string;

  constructor(
    id: string,
    userName: string,
    name: string,
    email: string,
    phoneNumber: string,
    imageUrl: string
  ) {
    this.id = id;
    this.userName = userName;
    this.name = name;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.imageUrl = imageUrl;
  }

  async initialize() {}
}

export const userConverter = {
  toFirestore: (order: User) => ({
    username: order.userName,
    name: order.name,
    email: order.email,
    phone: order.phoneNumber,
    userImageUrl: order.imageUrl,
  }),
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User => {
    const data = snapshot.data(options);
    return new User(
      snapshot.id,
      data.username,
      data.name,
      data.email,
      data.phone,
      data.userImageUrl
    );
  },
};