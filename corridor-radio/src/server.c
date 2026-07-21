/*
 * Corridor Radio - WebSocket server
 *
 * A minimal libwebsockets-based server that serves the static web
 * frontend from the www/ directory and exposes a WebSocket endpoint
 * that echoes messages back to connected clients.
 */

#include <libwebsockets.h>

#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CORRIDOR_MAX_PAYLOAD 4096

static volatile sig_atomic_t g_interrupted = 0;

/* Per-session data for the "corridor" protocol. */
struct per_session_data__corridor {
	unsigned char buf[LWS_PRE + CORRIDOR_MAX_PAYLOAD];
	size_t len;
	int has_pending;
};

static void
sigint_handler(int sig)
{
	(void)sig;
	g_interrupted = 1;
}

static int
callback_corridor(struct lws *wsi, enum lws_callback_reasons reason,
		  void *user, void *in, size_t len)
{
	struct per_session_data__corridor *pss =
		(struct per_session_data__corridor *)user;

	switch (reason) {
	case LWS_CALLBACK_ESTABLISHED:
		lwsl_user("corridor: client connected\n");
		pss->len = 0;
		pss->has_pending = 0;
		break;

	case LWS_CALLBACK_RECEIVE:
		if (len > CORRIDOR_MAX_PAYLOAD)
			len = CORRIDOR_MAX_PAYLOAD;

		memcpy(&pss->buf[LWS_PRE], in, len);
		pss->len = len;
		pss->has_pending = 1;

		/* Ask to be called back when the socket is writable. */
		lws_callback_on_writable(wsi);
		break;

	case LWS_CALLBACK_SERVER_WRITEABLE:
		if (pss->has_pending) {
			int n = lws_write(wsi, &pss->buf[LWS_PRE],
					  pss->len, LWS_WRITE_TEXT);
			if (n < (int)pss->len) {
				lwsl_err("corridor: write failed\n");
				return -1;
			}
			pss->has_pending = 0;
		}
		break;

	case LWS_CALLBACK_CLOSED:
		lwsl_user("corridor: client disconnected\n");
		break;

	default:
		break;
	}

	return 0;
}

/* Protocol table: the HTTP protocol plus our custom WebSocket protocol. */
static struct lws_protocols protocols[] = {
	{ "http", lws_callback_http_dummy, 0, 0, 0, NULL, 0 },
	{
		"corridor-protocol",
		callback_corridor,
		sizeof(struct per_session_data__corridor),
		CORRIDOR_MAX_PAYLOAD,
		0, NULL, 0
	},
	LWS_PROTOCOL_LIST_TERM
};

/* Serve static files from www/ at the site root. */
static const struct lws_http_mount mount = {
	NULL,			/* mount_next */
	"/",			/* mountpoint */
	"./www",		/* origin */
	"index.html",		/* default filename */
	NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0,
	LWSMPRO_FILE,		/* origin protocol */
	1,			/* mountpoint length */
	NULL,
};

int
main(int argc, char **argv)
{
	struct lws_context_creation_info info;
	struct lws_context *context;
	int port = 8080;

	if (argc > 1)
		port = atoi(argv[1]);

	signal(SIGINT, sigint_handler);
	signal(SIGTERM, sigint_handler);

	memset(&info, 0, sizeof(info));
	info.port = port;
	info.protocols = protocols;
	info.mounts = &mount;
	info.gid = -1;
	info.uid = -1;

	lwsl_user("Corridor Radio server starting on port %d\n", port);

	context = lws_create_context(&info);
	if (context == NULL) {
		lwsl_err("lws_create_context failed\n");
		return 1;
	}

	while (!g_interrupted) {
		if (lws_service(context, 0) < 0)
			break;
	}

	lwsl_user("Corridor Radio server shutting down\n");
	lws_context_destroy(context);

	return 0;
}
