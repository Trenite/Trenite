class FriendRequest {
  constructor(client, data) {
    Object.defineProperty(this, 'data', { value: data });
    Object.defineProperty(this, 'Client', { value: client });

    this.direction = data.direction || 'INCOMING'; // INCOMING, OUTGOING
    this.status = data.status || 'PENDING'; // PENDING, ACCEPTED, DECLINED
    this.friend = data.friend || undefined;
  }

  async accept() {
    if (this.status !== 'PENDING') return true;
    if (this.direction !== 'INCOMING') throw new Error('Can\'t accept an outgoing friend request');
    if (!this.friend.id) throw new Error('Can\'t accept a friend request without an id');

    const req = await this.Client.addFriend(this.friend.id);
    if (req === true) {
      this.status = 'ACCEPTED';
      return true;
    }
    return false;
  }

  async decline() {
    if (this.status !== 'PENDING') return true;
    if (this.direction !== 'INCOMING') throw new Error('Can\'t accept an outgoing friend request');
    if (!this.friend.id) throw new Error('Can\'t accept a friend request without an id');

    const req = await this.Client.addFriend(this.friend.id);
    if (req) {
      this.status = 'DECLINED';
      return true;
    }
    return false;
  }
}

module.exports = FriendRequest;
