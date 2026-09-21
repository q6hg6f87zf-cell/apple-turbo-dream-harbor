import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  CANONICAL_REDIRECT,
  discordHandleFromUser,
  discordRedirectUri,
  homeRedirect,
  isLiveRealmHost,
  riderCookie,
  readRiderSession,
  RIDER_COOKIE,
} from "./discord-native.server.ts";

const originalSecret = process.env.DISCORD_CLIENT_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.DISCORD_CLIENT_SECRET;
  else process.env.DISCORD_CLIENT_SECRET = originalSecret;
});

test("live realm hosts include apex and www", () => {
  assert.equal(isLiveRealmHost("thehollowrealm.com"), true);
  assert.equal(isLiveRealmHost("www.thehollowrealm.com"), true);
  assert.equal(isLiveRealmHost("localhost:8080"), false);
  assert.equal(isLiveRealmHost("apple-turbo-dream-harbor.vercel.app"), false);
});

test("discord redirect uri is always the apex callback on live hosts", () => {
  const apex = new Request("https://thehollowrealm.com/api/discord/start", {
    headers: { host: "thehollowrealm.com" },
  });
  const www = new Request("https://www.thehollowrealm.com/api/discord/start", {
    headers: { host: "www.thehollowrealm.com" },
  });
  const vercel = new Request("https://hollow-realm.vercel.app/api/discord/start", {
    headers: { host: "hollow-realm.vercel.app" },
  });
  const local = new Request("http://localhost:8080/api/discord/start", {
    headers: { host: "localhost:8080", "x-forwarded-proto": "http" },
  });
  assert.equal(discordRedirectUri(apex), CANONICAL_REDIRECT);
  assert.equal(discordRedirectUri(www), CANONICAL_REDIRECT);
  assert.equal(discordRedirectUri(vercel), CANONICAL_REDIRECT);
  assert.equal(discordRedirectUri(local), "http://localhost:8080/api/discord/callback");
});

test("discord handle prefers username and global name", () => {
  const profile = discordHandleFromUser({
    id: "123456789012345678",
    username: "brontosaurus",
    global_name: "Brent McDonald",
    discriminator: "0",
  });
  assert.equal(profile?.handle, "brontosaurus");
  assert.equal(profile?.name, "Brent McDonald");
});

test("OAuth success bounce is auth=ok, not a Discord user id", () => {
  const request = new Request("https://thehollowrealm.com/api/discord/callback", {
    headers: { host: "thehollowrealm.com" },
  });
  const location = homeRedirect(request, { auth: "ok" });
  assert.match(location, /[?&]auth=ok/);
  assert.doesNotMatch(location, /[?&]discord=ok/);
});

test("signed rider cookies round-trip and reject tampers", () => {
  process.env.DISCORD_CLIENT_SECRET = "unit-test-secret";
  const cookie = riderCookie({
    did: "123456789012345678",
    handle: "brontosaurus",
    name: "Brent McDonald",
    stamped: true,
  });
  assert.match(cookie, new RegExp(`^${RIDER_COOKIE}=`));
  const token = decodeURIComponent(cookie.slice(RIDER_COOKIE.length + 1).split(";")[0] ?? "");
  const request = new Request("https://thehollowrealm.com/api/hollow/access", {
    headers: { cookie: `${RIDER_COOKIE}=${encodeURIComponent(token)}` },
  });
  const session = readRiderSession(request);
  assert.equal(session?.did, "123456789012345678");
  assert.equal(session?.handle, "brontosaurus");
  assert.equal(session?.name, "Brent McDonald");
  assert.equal(session?.stamped, true);

  const [body] = token.split(".");
  const bad = new Request("https://thehollowrealm.com/api/hollow/access", {
    headers: { cookie: `${RIDER_COOKIE}=${body}.aaaaaaaa` },
  });
  assert.equal(readRiderSession(bad), null);
});
