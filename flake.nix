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
      url = "github:mirkolenz/flocken/v2";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs =
    inputs@{
      flake-parts,
      systems,
      flocken,
      self,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;
      imports = [
        inputs.treefmt-nix.flakeModule
      ];
      perSystem =
        {
          pkgs,
          system,
          lib,
          config,
          ...
        }:
        let
          nodejs = pkgs.nodejs_20;
          python = pkgs.python3.withPackages (p: with p; [ setuptools ]);
          npmlock2nix = import inputs.npmlock2nix { inherit pkgs; };
          caddyport = "8080";
          caddyfile = pkgs.writeText "caddyfile" ''
            {
              admin off
              auto_https off
              persist_config off
            }
            :${caddyport} {
              root * ${config.packages.default}
              encode gzip
              file_server {
                index index.html
              }
            }
          '';
        in
        {
          devShells.default = pkgs.mkShell {
            shellHook = ''
              ${lib.getExe' nodejs "npm"} install
              ${lib.getExe nodejs} --version > .node-version
            '';
            packages = [
              nodejs
              config.treefmt.build.wrapper
            ];
          };
          checks = {
            inherit (config.packages) arguemapper server;
          };
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              prettier = {
                enable = true;
                excludes = [
                  "CHANGELOG.md"
                ];
              };
              nixfmt.enable = true;
            };
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
                buildInputs = [ python ];
              };
            };
            arguemapper = config.packages.default;
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
              contents = [ pkgs.dockerTools.fakeNss ];
              config = {
                entrypoint = [ (lib.getExe config.packages.server) ];
                exposedPorts = {
                  "${caddyport}/tcp" = { };
                };
                user = "nobody:nobody";
              };
            };
          };
          legacyPackages.dockerManifest = flocken.legacyPackages.${system}.mkDockerManifest {
            github = {
              enable = true;
              token = "$GH_TOKEN";
            };
            version = builtins.getEnv "VERSION";
            images = with self.packages; [ x86_64-linux.docker ];
          };
        };
    };
}
