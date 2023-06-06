# https://devenv.sh/reference/options/
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    npmlock2nix = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
  };
  outputs = inputs @ {
    nixpkgs,
    flake-parts,
    systems,
    npmlock2nix,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = import systems;
      perSystem = {
        pkgs,
        system,
        lib,
        self',
        ...
      }: {
        _module.args.pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [
            (final: prev: {
              npmlock2nix = import npmlock2nix {pkgs = prev;};
            })
          ];
        };
        devShells.default = pkgs.mkShell {
          shellHook = "npm install";
          packages = with pkgs; [nodejs-18_x];
        };
        apps.copyDockerImage = {
          type = "app";
          program = builtins.toString (pkgs.writeShellScript "copyDockerImage" ''
            IFS=$'\n' # iterate over newlines
            set -x # echo on
            for DOCKER_TAG in $DOCKER_METADATA_OUTPUT_TAGS; do
              ${lib.getExe pkgs.skopeo} --insecure-policy copy "docker-archive:${self'.packages.dockerImage}" "docker://$DOCKER_TAG"
            done
          '');
        };
        packages = let
          app = pkgs.npmlock2nix.v2.build {
            src = ./.;
            installPhase = "cp -r dist $out";
            buildCommands = [
              "export HOME=$out"
              "npm run build"
            ];
            node_modules_attrs = {
              nodejs = pkgs.nodejs-18_x;
              # Python is needed for node-gyp/libsass
              buildInputs = with pkgs; [python3];
            };
          };
        in {
          default = app;
          arguemapper = app;
          dockerImage = let
            port = "8080";
            # ${builtins.readFile "${pkgs.nginx}/conf/mime.types"}
            conf = pkgs.writeText "nginx.conf" ''
              user nobody nobody;
              daemon off;
              error_log /dev/stdout info;
              pid /dev/null;
              events {}
              http {
                access_log /dev/stdout;
                include ${pkgs.nginx}/conf/mime.types;
                default_type application/octet-stream;
                # optimisation
                sendfile on;
                tcp_nopush on;
                tcp_nodelay on;
                keepalive_timeout 65;
                server {
                  server_name localhost;
                  listen ${port};
                  location / {
                    root ${app}/dist;
                    index index.html;
                  }
                }
              }
            '';
          in
            # https://github.com/nlewo/nix2container/blob/master/examples/nginx.nix
            # https://github.com/NixOS/nixpkgs/blob/07745bbbaf0e24f640be6494bc6ed114c50df05f/pkgs/build-support/docker/examples.nix#L63
            pkgs.dockerTools.buildImage {
              name = "arguemapper";
              tag = "latest";
              created = "now";
              copyToRoot = [
                pkgs.dockerTools.fakeNss
              ];
              runAsRoot = ''
                #!${pkgs.runtimeShell}
                mkdir -p tmp
                mkdir -p var/log/nginx
                mkdir -p var/cache/nginx
                # chown nobody:nobody tmp
                # chown nobody:nobody var/log/nginx
                # chown nobody:nobody var/cache/nginx
              '';
              config = {
                cmd = [(lib.getExe pkgs.nginx) "-c" conf];
                exposedPorts = {
                  "${port}/tcp" = {};
                };
                # user = "101:101";
                # user = "nobodny:nobody";
              };
            };
        };
      };
    };
}
