using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;

namespace Mirror.Server.Realtime;

/// <summary>
/// Tracks the open dashboard/phone WebSocket connections and fans a message out
/// to all of them. Receive-only from the client's side: saves go over REST, and
/// every connected client hears the resulting update here so edits appear live.
/// </summary>
public sealed class NoteBroadcaster
{
    private readonly ConcurrentDictionary<Guid, WebSocket> _sockets = new();

    public Guid Add(WebSocket socket)
    {
        var id = Guid.NewGuid();
        _sockets[id] = socket;
        return id;
    }

    public void Remove(Guid id) => _sockets.TryRemove(id, out _);

    public async Task BroadcastAsync(string message)
    {
        var bytes = Encoding.UTF8.GetBytes(message);
        foreach (var (id, socket) in _sockets)
        {
            if (socket.State != WebSocketState.Open)
            {
                Remove(id);
                continue;
            }

            try
            {
                await socket.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, CancellationToken.None);
            }
            catch
            {
                Remove(id);
            }
        }
    }
}
