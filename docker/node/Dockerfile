# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM debian:12 AS builder

ARG DEBIAN_FRONTEND=noninteractive
ARG BRANCH=DePIN-Test

RUN apt-get update && apt-get install -y --no-install-recommends \
    autoconf \
    automake \
    autotools-dev \
    binutils \
    bison \
    bsdmainutils \
    build-essential \
    ca-certificates \
    cmake \
    curl \
    git \
    gnupg \
    libffi-dev \
    libfontconfig1 \
    libfreetype6 \
    libssl-dev \
    libtool \
    libxcb-cursor0 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-randr0 \
    libxcb-render-util0 \
    libxcb-shape0 \
    libxcb-sync1 \
    libxcb-xfixes0 \
    libxcb-xkb1 \
    libxkbcommon0 \
    libxkbcommon-x11-0 \
    meson \
    ninja-build \
    pkg-config \
    python3 \
    unzip \
    wget \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /root

RUN git clone --branch ${BRANCH} --single-branch \
    https://github.com/NeuraiProject/Neurai.git

WORKDIR /root/Neurai/depends

RUN make HOST=x86_64-pc-linux-gnu -j$(nproc)

WORKDIR /root/Neurai

RUN contrib/install_db4.sh ../

ENV BDB_PREFIX=/root/db4

RUN ./autogen.sh

RUN CONFIG_SITE=$PWD/depends/x86_64-pc-linux-gnu/share/config.site \
    ./configure \
      --prefix=$PWD/depends/x86_64-pc-linux-gnu \
      --disable-shared \
      --disable-maintainer-mode \
      --disable-tests \
      --disable-bench \
      --without-gui \
      --with-pic \
      LDFLAGS="-L${BDB_PREFIX}/lib/" \
      CPPFLAGS="-I${BDB_PREFIX}/include/"

RUN make -j$(nproc)

# ── Stage 2: Runtime ───────────────────────────────────────────────────────
FROM debian:12

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/Neurai/src/neuraid     /usr/local/bin/neuraid
COPY --from=builder /root/Neurai/src/neurai-cli  /usr/local/bin/neurai-cli
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/data"]

EXPOSE 19100 19101

ENTRYPOINT ["entrypoint.sh"]
