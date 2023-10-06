{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    npmlock2nix = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
    flocken = {
      url = "github:mirkolenz/flocken/v1";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = inputs @ {
    nixpkgs,
    flake-parts,
    systems,
    flocken,
    self,
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
      }: let
        nodejs = pkgs.nodejs_20;
        npmlock2nix = import inputs.npmlock2nix {inherit pkgs;};
        caddyport = "8080";
        caddyfile = pkgs.writeText "caddyfile" ''
          {
            admin off
            auto_https off
            persist_config off
          }
          :${caddyport} {
            root * ${self'.packages.default}
            encode gzip
            file_server {
              index index.html
            }
          }
        '';
      in {
        devShells.default = pkgs.mkShell {
          shellHook = ''
            ${lib.getExe' nodejs "npm"} install
            ${lib.getExe nodejs} --version > .node-version
          '';
          packages = [nodejs];
        };
        apps.dockerManifest = {
          type = "app";
          program = lib.getExe (flocken.legacyPackages.${system}.mkDockerManifest {
            branch = builtins.getEnv "GITHUB_REF_NAME";
            name = "ghcr.io/" + builtins.getEnv "GITHUB_REPOSITORY";
            version = builtins.getEnv "VERSION";
            images = with self.packages; [x86_64-linux.docker aarch64-linux.docker];
          });
        };
        packages = {
          default = npmlock2nix.v2.build {
            src = ./.;
            installPhase = "cp -r dist/. $out";
            buildCommands = [
              "HOME=$TMPDIR"
              "npm run build"
            ];
            node_modules_attrs = {
              inherit nodejs;
              # Python is needed for node-gyp/libsass
              buildInputs = with pkgs; [python3];
            };
          };
          arguemapper = self'.packages.default;
          server = pkgs.writeShellApplication {
            name = "server";
            text = ''
              ${lib.getExe pkgs.caddy} run --config ${caddyfile} --adapter caddyfile
            '';
          };
          docker = pkgs.dockerTools.buildLayeredImage {
            name = "arguemapper";
            tag = "latest";
            created = "now";
            contents = [
              pkgs.dockerTools.fakeNss
            ];
            config = {
              entrypoint = [(lib.getExe self'.packages.server)];
              exposedPorts = {
                "${caddyport}/tcp" = {};
              };
              user = "nobody:nobody";
            };
          };
        };
      };
    };
}
